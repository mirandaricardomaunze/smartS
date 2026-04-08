// Supabase Edge Function: create-checkout
// Cria uma sessão de checkout no Stripe e devolve o URL para a app abrir.
//
// Deploy: supabase functions deploy create-checkout
// Variáveis de ambiente necessárias (supabase secrets set):
//   STRIPE_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

const PLAN_PRICES: Record<string, string> = {
  // IDs dos Price do Stripe (criar em dashboard.stripe.com/products)
  BASIC: Deno.env.get('STRIPE_PRICE_BASIC') ?? '',
  PRO:   Deno.env.get('STRIPE_PRICE_PRO')   ?? '',
  ELITE: Deno.env.get('STRIPE_PRICE_ELITE') ?? '',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Validar autenticação via JWT do Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autenticado' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return json({ error: 'Token inválido' }, 401)
    }

    const body = await req.json()
    const { plan, company_id, success_url, cancel_url } = body

    if (!plan || !company_id || !PLAN_PRICES[plan]) {
      return json({ error: 'Plano inválido ou company_id em falta' }, 400)
    }

    // Verificar que o utilizador pertence à empresa
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .eq('company_id', company_id)
      .single()

    if (!userRecord || userRecord.role !== 'admin') {
      return json({ error: 'Apenas administradores podem gerir subscrições' }, 403)
    }

    // Obter ou criar customer no Stripe
    let stripeCustomerId: string | undefined

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', company_id)
      .single()

    stripeCustomerId = subscription?.stripe_customer_id

    if (!stripeCustomerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('company_id', company_id)
        .single()

      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        name: profile?.name ?? undefined,
        metadata: { company_id, user_id: user.id },
      })
      stripeCustomerId = customer.id

      // Guardar o customer ID para futuras sessões
      await supabase.from('subscriptions').upsert(
        { company_id, stripe_customer_id: stripeCustomerId, plan, status: 'incomplete', synced: 0 },
        { onConflict: 'company_id' }
      )
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
      mode: 'subscription',
      success_url: success_url ?? `${Deno.env.get('SUPABASE_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url ?? `${Deno.env.get('SUPABASE_URL')}/checkout/cancel`,
      metadata: { company_id, plan, user_id: user.id },
      subscription_data: {
        metadata: { company_id, plan },
      },
      locale: 'pt',
    })

    return json({ checkout_url: session.url, session_id: session.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[create-checkout] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
