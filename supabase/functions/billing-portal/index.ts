// Supabase Edge Function: billing-portal
// Cria uma sessão no Stripe Customer Portal para o utilizador gerir a subscrição
// (cancelar, alterar cartão, ver histórico de faturas).
//
// Deploy: supabase functions deploy billing-portal
// Variáveis necessárias: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'Token inválido' }, 401)

    const { company_id, return_url } = await req.json()
    if (!company_id) return json({ error: 'company_id obrigatório' }, 400)

    // Verificar que o utilizador pertence à empresa como admin
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .eq('company_id', company_id)
      .single()

    if (!userRecord || userRecord.role !== 'admin') {
      return json({ error: 'Apenas administradores podem gerir facturação' }, 403)
    }

    // Obter o stripe_customer_id da empresa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', company_id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return json({ error: 'Nenhuma subscrição Stripe encontrada para esta empresa.' }, 404)
    }

    // Criar sessão do Customer Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: return_url ?? `${Deno.env.get('SUPABASE_URL')}/billing/return`,
      locale: 'pt',
    })

    return json({ portal_url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[billing-portal] Erro:', message)
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
