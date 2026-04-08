import { useSubscription } from './useSubscription'
import { getLimits, isWithinLimit, hasFeature, getLimitMessage, PlanLimits } from '@/utils/planLimits'
import { PlanType } from '@/types'

/**
 * Hook que expõe os limites do plano actual do utilizador.
 *
 * @example
 * const { canAdd, limits, plan } = usePlanLimits()
 *
 * // Verificar antes de criar produto:
 * if (!canAdd('maxProducts', currentProductCount)) {
 *   showToast('Limite de produtos atingido. Faz upgrade.')
 *   return
 * }
 */
export function usePlanLimits() {
  const { plan, isTrialExpired } = useSubscription()

  const effectivePlan: PlanType = isTrialExpired ? 'TRIAL' : (plan as PlanType)
  const limits: PlanLimits = getLimits(effectivePlan)

  /**
   * Verifica se é possível adicionar mais um item de um tipo limitado.
   * @param limitKey - Campo do PlanLimits a verificar (ex: 'maxProducts')
   * @param currentCount - Quantidade actual de itens
   */
  function canAdd(limitKey: 'maxProducts' | 'maxCustomers' | 'maxSuppliers' | 'maxUsers', currentCount: number): boolean {
    if (isTrialExpired) return false
    return isWithinLimit(currentCount, limits[limitKey] as number)
  }

  /**
   * Verifica se um módulo/feature está disponível no plano actual.
   * @param feature - Campo booleano de PlanLimits (ex: 'hasHR')
   */
  function canUse(feature: keyof PlanLimits): boolean {
    if (isTrialExpired && feature !== 'hasPOS' && feature !== 'hasScanner') return false
    return hasFeature(effectivePlan, feature)
  }

  /**
   * Devolve a mensagem de limite para o utilizador.
   */
  function limitMessage(limitKey: 'maxProducts' | 'maxCustomers' | 'maxSuppliers' | 'maxUsers'): string {
    return getLimitMessage(limitKey)
  }

  return {
    plan: effectivePlan,
    limits,
    isTrialExpired,
    canAdd,
    canUse,
    limitMessage,
  }
}
