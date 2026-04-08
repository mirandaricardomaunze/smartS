import { financialRepository } from '@/repositories/financialRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { FinancialTransaction } from '@/types'

/**
 * Feature-local finance service.
 * Centralises permission checks and company-scoped data access
 * for financial transaction operations.
 */
export const financeService = {
  getAll(): FinancialTransaction[] {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'view_reports')) {
      throw new Error('Sem permissão para ver finanças')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    return financialRepository.getAll(activeCompanyId)
  },

  create(data: Omit<FinancialTransaction, 'id' | 'created_at' | 'synced'>): FinancialTransaction {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_movements')) {
      throw new Error('Sem permissão para registar transacções')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    const finalData = { ...data }
    if (!finalData.company_id && activeCompanyId) {
      finalData.company_id = activeCompanyId
    }

    return financialRepository.create(finalData)
  },

  getStats(startDate: string, endDate: string) {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'view_reports')) {
      throw new Error('Sem permissão para ver estatísticas financeiras')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { income: 0, expense: 0 }

    return financialRepository.getStats(activeCompanyId, startDate, endDate)
  },
}
