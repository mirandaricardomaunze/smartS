import { syncRepository, SyncQueueItem } from '@/repositories/syncRepository'

export const syncService = {
  getPending(): SyncQueueItem[] {
    return syncRepository.getPending()
  },
  getErrors(): SyncQueueItem[] {
      return syncRepository.getErrors()
  },
  getStats(): { pending: number; errors: number } {
    return syncRepository.getStats()
  }
}
