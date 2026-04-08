import { PlanType } from '@/types'

// ==============================================================================
// Limites por Plano de Subscrição
// ==============================================================================

export interface PlanLimits {
  /** Máximo de produtos activos (-1 = ilimitado) */
  maxProducts: number
  /** Máximo de clientes (-1 = ilimitado) */
  maxCustomers: number
  /** Máximo de fornecedores (-1 = ilimitado) */
  maxSuppliers: number
  /** Máximo de utilizadores por empresa (-1 = ilimitado) */
  maxUsers: number
  /** Máximo de empresas por conta (-1 = ilimitado) */
  maxCompanies: number
  /** Módulo RH disponível */
  hasHR: boolean
  /** Módulo Financeiro completo */
  hasFinance: boolean
  /** Módulo POS */
  hasPOS: boolean
  /** Relatórios avançados */
  hasReports: boolean
  /** Backup automático */
  hasBackup: boolean
  /** Sincronização em tempo real */
  hasRealtime: boolean
  /** Scanner de código de barras */
  hasScanner: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  TRIAL: {
    maxProducts:   100,
    maxCustomers:  50,
    maxSuppliers:  20,
    maxUsers:      3,
    maxCompanies:  1,
    hasHR:         false,
    hasFinance:    false,
    hasPOS:        true,
    hasReports:    false,
    hasBackup:     false,
    hasRealtime:   false,
    hasScanner:    true,
  },
  BASIC: {
    maxProducts:   500,
    maxCustomers:  200,
    maxSuppliers:  100,
    maxUsers:      5,
    maxCompanies:  2,
    hasHR:         false,
    hasFinance:    true,
    hasPOS:        true,
    hasReports:    true,
    hasBackup:     true,
    hasRealtime:   false,
    hasScanner:    true,
  },
  PRO: {
    maxProducts:   2000,
    maxCustomers:  1000,
    maxSuppliers:  500,
    maxUsers:      15,
    maxCompanies:  5,
    hasHR:         true,
    hasFinance:    true,
    hasPOS:        true,
    hasReports:    true,
    hasBackup:     true,
    hasRealtime:   true,
    hasScanner:    true,
  },
  ELITE: {
    maxProducts:   -1,
    maxCustomers:  -1,
    maxSuppliers:  -1,
    maxUsers:      -1,
    maxCompanies:  -1,
    hasHR:         true,
    hasFinance:    true,
    hasPOS:        true,
    hasReports:    true,
    hasBackup:     true,
    hasRealtime:   true,
    hasScanner:    true,
  },
}

// Preços dos planos (para exibição na UI — preços reais estão no Stripe)
export interface PlanInfo {
  name: string
  price: string       // ex: "9.99"
  currency: string    // ex: "USD"
  period: string      // ex: "/mês"
  description: string
  highlight: boolean
}

export const PLAN_INFO: Record<Exclude<PlanType, 'TRIAL'>, PlanInfo> = {
  BASIC: {
    name:        'Basic',
    price:       '200',
    currency:    'MT',
    period:      '/mês',
    description: 'Para pequenos negócios que começam',
    highlight:   false,
  },
  PRO: {
    name:        'Pro',
    price:       '450',
    currency:    'MT',
    period:      '/mês',
    description: 'Para empresas em crescimento',
    highlight:   true,
  },
  ELITE: {
    name:        'Elite',
    price:       '700',
    currency:    'MT',
    period:      '/mês',
    description: 'Para grandes operações sem limites',
    highlight:   false,
  },
}

/**
 * Obtém os limites do plano actual.
 */
export function getLimits(plan: PlanType | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? 'TRIAL']
}

/**
 * Verifica se um determinado número está dentro do limite do plano.
 * @param current - Valor actual (ex: número de produtos)
 * @param limit   - Limite do plano (-1 = ilimitado)
 */
export function isWithinLimit(current: number, limit: number): boolean {
  return limit === -1 || current < limit
}

/**
 * Verifica se um recurso (feature) está disponível no plano.
 */
export function hasFeature(plan: PlanType | null | undefined, feature: keyof PlanLimits): boolean {
  const limits = getLimits(plan)
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number')  return value === -1 || value > 0
  return false
}

/**
 * Devolve a mensagem de limite excedido para exibir ao utilizador.
 */
export function getLimitMessage(feature: 'maxProducts' | 'maxCustomers' | 'maxSuppliers' | 'maxUsers'): string {
  const labels: Record<string, string> = {
    maxProducts:  'produtos',
    maxCustomers: 'clientes',
    maxSuppliers: 'fornecedores',
    maxUsers:     'utilizadores',
  }
  return `Limite de ${labels[feature] ?? feature} atingido. Faz upgrade do teu plano para continuar.`
}

/**
 * Compara dois planos e diz se `targetPlan` é um upgrade de `currentPlan`.
 */
export function isUpgrade(currentPlan: PlanType, targetPlan: PlanType): boolean {
  const order: PlanType[] = ['TRIAL', 'BASIC', 'PRO', 'ELITE']
  return order.indexOf(targetPlan) > order.indexOf(currentPlan)
}
