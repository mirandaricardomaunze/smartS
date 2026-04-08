import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from './supabase'
import { PlanType } from '@/types'
import { logger } from '@/utils/logger'

// Scheme da app para redirect pós-pagamento (definido em app.json)
const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME ?? 'smarts'

export type CheckoutResult =
  | { status: 'success'; sessionId: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

export const stripeService = {
  /**
   * Abre o Stripe Checkout para o plano indicado.
   * Fluxo: app → Edge Function → Stripe Checkout (browser) → deep link → app
   */
  async openCheckout(companyId: string, plan: PlanType): Promise<CheckoutResult> {
    if (plan === 'TRIAL') {
      return { status: 'error', message: 'O plano TRIAL não requer pagamento.' }
    }

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) {
        return { status: 'error', message: 'Sessão expirada. Por favor inicia sessão novamente.' }
      }

      const successUrl = Linking.createURL('payment/success')
      const cancelUrl  = Linking.createURL('payment/cancel')

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan,
          company_id: companyId,
          success_url: successUrl,
          cancel_url:  cancelUrl,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        logger.error('[stripe] Edge function error:', err)
        return { status: 'error', message: err.error ?? 'Não foi possível iniciar o pagamento.' }
      }

      const { checkout_url, session_id } = await response.json()

      if (!checkout_url) {
        return { status: 'error', message: 'URL de checkout inválido.' }
      }

      // Abrir Stripe Checkout no browser
      const result = await WebBrowser.openAuthSessionAsync(
        checkout_url,
        `${APP_SCHEME}://payment`,
        { showInRecents: true }
      )

      if (result.type === 'success') {
        const url = result.url
        if (url.includes('payment/success')) {
          return { status: 'success', sessionId: session_id }
        }
        return { status: 'cancelled' }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { status: 'cancelled' }
      }

      return { status: 'error', message: 'Checkout interrompido.' }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      logger.error('[stripe] openCheckout falhou:', message)
      return { status: 'error', message }
    }
  },

  /**
   * Abre o portal de gestão de subscrição do Stripe (cancelar, alterar cartão, etc.)
   */
  async openBillingPortal(companyId: string): Promise<void> {
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) return

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/billing-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ company_id: companyId }),
      })

      if (response.ok) {
        const { portal_url } = await response.json()
        if (portal_url) {
          await WebBrowser.openBrowserAsync(portal_url)
        }
      }
    } catch (err) {
      logger.error('[stripe] openBillingPortal falhou:', err)
    }
  },
}
