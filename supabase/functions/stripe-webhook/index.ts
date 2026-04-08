// Supabase Edge Function: stripe-webhook
// Recebe eventos do Stripe e actualiza o estado das subscrições.
//
// Deploy: supabase functions deploy stripe-webhook
// Configurar em Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://SEU_PROJECTO.supabase.co/functions/v1/stripe-webhook
//   Eventos: checkout.session.completed, customer.subscription.updated,
//            customer.subscription.deleted, invoice.payment_failed
//
// Variáveis de ambiente:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Assinatura inválida'
    console.error('[stripe-webhook] Verificação falhou:', msg)
    return new Response(`Webhook Error: ${msg}`, { status: 400 })
  }

  console.log(`[stripe-webhook] Evento recebido: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionCancelled(sub)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
      default:
        console.log(`[stripe-webhook] Evento não tratado: ${event.type}`)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error(`[stripe-webhook] Erro ao processar ${event.type}:`, msg)
    return new Response(`Erro interno: ${msg}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const company_id = session.metadata?.company_id
  const plan       = session.metadata?.plan

  if (!company_id || !plan) {
    console.warn('[stripe-webhook] checkout.session.completed sem metadata company_id/plan')
    return
  }

  const stripeSubId    = session.subscription as string
  const stripeSub      = await stripe.subscriptions.retrieve(stripeSubId)
  const periodStart    = new Date(stripeSub.current_period_start * 1000).toISOString()
  const periodEnd      = new Date(stripeSub.current_period_end   * 1000).toISOString()

  // Actualizar subscriptions
  await supabase.from('subscriptions').upsert({
    company_id,
    plan,
    status:                 'active',
    stripe_subscription_id: stripeSubId,
    stripe_customer_id:     session.customer as string,
    current_period_start:   periodStart,
    current_period_end:     periodEnd,
    cancel_at_period_end:   false,
    synced: 0,
  }, { onConflict: 'company_id' })

  // Actualizar profiles
  await supabase.from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('company_id', company_id)

  console.log(`[stripe-webhook] Empresa ${company_id} activada no plano ${plan}`)
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const company_id = sub.metadata?.company_id
  if (!company_id) return

  const plan      = sub.metadata?.plan ?? 'BASIC'
  const status    = sub.status === 'active' ? 'active' : sub.status
  const periodEnd = new Date(sub.current_period_end * 1000).toISOString()

  await supabase.from('subscriptions').upsert({
    company_id,
    plan,
    status,
    current_period_end:   periodEnd,
    cancel_at_period_end: sub.cancel_at_period_end,
    synced: 0,
  }, { onConflict: 'company_id' })

  if (status === 'active') {
    await supabase.from('profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('company_id', company_id)
  }

  console.log(`[stripe-webhook] Subscrição ${company_id} actualizada: ${status}`)
}

async function handleSubscriptionCancelled(sub: Stripe.Subscription) {
  const company_id = sub.metadata?.company_id
  if (!company_id) return

  await supabase.from('subscriptions').upsert({
    company_id,
    status: 'canceled',
    cancel_at_period_end: true,
    synced: 0,
  }, { onConflict: 'company_id' })

  // Fazer downgrade para TRIAL ao cancelar
  await supabase.from('profiles')
    .update({ plan: 'TRIAL', updated_at: new Date().toISOString() })
    .eq('company_id', company_id)

  console.log(`[stripe-webhook] Subscrição ${company_id} cancelada — downgrade para TRIAL`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  if (!customerId) return

  const { data } = await supabase.from('subscriptions')
    .select('company_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (data?.company_id) {
    await supabase.from('subscriptions').upsert({
      company_id: data.company_id,
      status: 'past_due',
      synced: 0,
    }, { onConflict: 'company_id' })

    console.warn(`[stripe-webhook] Pagamento falhado para empresa ${data.company_id}`)
  }
}
