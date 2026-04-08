import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases'
import { Platform } from 'react-native'
import { logger } from '@/utils/logger'
import { PlanType } from '@/types'

// ==============================================================================
// RevenueCat — Google Play Billing
// Configurar em: https://app.revenuecat.com
// ==============================================================================

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? ''

/**
 * Entitlement identifier exacto criado no RevenueCat dashboard.
 * O wizard criou: "SmartS Pro"
 * Todos os packages (Monthly/Yearly) dão acesso a este entitlement → mapeado para PRO.
 */
export const ENTITLEMENT_PLAN_MAP: Record<string, Exclude<PlanType, 'TRIAL'>> = {
  'SmartS Pro': 'PRO',
}

/**
 * Mapeamento package identifier (RevenueCat) → PlanType
 * O wizard criou packages com identifiers padrão do RevenueCat.
 * Usamos apenas Monthly ($rc_monthly) — é Subscription recorrente.
 */
export const PACKAGE_PLAN_MAP: Record<string, Exclude<PlanType, 'TRIAL'>> = {
  '$rc_monthly': 'PRO',
  '$rc_annual':  'PRO',
}

export type PurchaseResult =
  | { status: 'success'; plan: PlanType; customerInfo: CustomerInfo }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

/** Packages disponíveis por plano, vindos do Play Store via RevenueCat */
export type PlanPackages = Partial<Record<Exclude<PlanType, 'TRIAL'>, PurchasesPackage>>

export const revenueCatService = {
  /**
   * Inicializar RevenueCat com o ID do utilizador.
   * Chamar após login.
   */
  configure(userId: string): void {
    if (!RC_API_KEY) {
      logger.warn('[rc] EXPO_PUBLIC_REVENUECAT_API_KEY não configurado — billing desactivado')
      return
    }
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN)
    Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId })
    logger.info('[rc] RevenueCat configurado para:', userId)
  },

  /**
   * Obter packages disponíveis agrupados por plano.
   * Os preços vêm directamente do Google Play Console (em MT ou moeda local).
   */
  async getOffering(): Promise<PlanPackages> {
    try {
      const offerings = await Purchases.getOfferings()
      const current = offerings.current
      if (!current) {
        logger.warn('[rc] Nenhuma offering activa no RevenueCat')
        return {}
      }

      const result: PlanPackages = {}
      for (const pkg of current.availablePackages) {
        const plan = PACKAGE_PLAN_MAP[pkg.identifier]
        if (plan) result[plan] = pkg
      }
      return result
    } catch (err) {
      logger.error('[rc] getOffering falhou:', err)
      return {}
    }
  },

  /**
   * Iniciar compra de um package via Google Play Billing.
   * Mostra o ecrã de pagamento nativo do Play Store.
   */
  async purchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      const plan = this.getActivePlan(customerInfo)
      if (plan) {
        return { status: 'success', plan, customerInfo }
      }
      return { status: 'error', message: 'Compra processada mas entitlement não activado. Contacta o suporte.' }
    } catch (err: any) {
      if (err?.userCancelled) return { status: 'cancelled' }
      logger.error('[rc] purchase falhou:', err)
      return { status: 'error', message: err?.message ?? 'Erro ao processar compra.' }
    }
  },

  /**
   * Restaurar compras anteriores (obrigatório para a Play Store).
   */
  async restore(): Promise<PurchaseResult> {
    try {
      const customerInfo = await Purchases.restorePurchases()
      const plan = this.getActivePlan(customerInfo)
      if (plan) {
        return { status: 'success', plan, customerInfo }
      }
      return { status: 'error', message: 'Nenhuma subscrição activa encontrada.' }
    } catch (err: any) {
      logger.error('[rc] restore falhou:', err)
      return { status: 'error', message: err?.message ?? 'Erro ao restaurar compras.' }
    }
  },

  /**
   * Informação actual da subscrição do utilizador.
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo()
    } catch (err) {
      logger.error('[rc] getCustomerInfo falhou:', err)
      return null
    }
  },

  /**
   * Detecta o plano activo a partir dos entitlements do RevenueCat.
   * Verifica todos os entitlements conhecidos e devolve o mais alto activo.
   */
  getActivePlan(customerInfo: CustomerInfo): Exclude<PlanType, 'TRIAL'> | null {
    const active = customerInfo.entitlements.active
    for (const [entitlementId, plan] of Object.entries(ENTITLEMENT_PLAN_MAP)) {
      if (active[entitlementId]) return plan
    }
    return null
  },

  /**
   * Terminar sessão no RevenueCat (chamar no logout).
   */
  async logOut(): Promise<void> {
    try {
      await Purchases.logOut()
    } catch (err) {
      logger.error('[rc] logOut falhou:', err)
    }
  },
}
