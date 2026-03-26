import { syncRepository, SyncQueueItem } from '@/repositories/syncRepository'
import { useCompanyStore } from '@/store/companyStore'

export const syncService = {
  getPending(): SyncQueueItem[] {
    const companyId = useCompanyStore.getState().activeCompanyId
    return syncRepository.getPending(companyId || '')
  },
  getErrors(): SyncQueueItem[] {
      return syncRepository.getErrors()
  },
  getStats(): { pending: number; errors: number } {
    return syncRepository.getStats()
  }
}
