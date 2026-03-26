import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { HistoryEntry } from '@/types'

export const historyService = {
  getAll(limit: number = 50, offset: number = 0): HistoryEntry[] {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'view_history')) {
      throw new Error('Sem permissão para ver histórico')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    
    return historyRepository.getAll(activeCompanyId, limit, offset)
  },
}
