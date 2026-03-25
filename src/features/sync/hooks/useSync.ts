import { useState, useCallback, useEffect } from 'react'
import { syncService } from '../services/syncService'
import { syncData } from '@/utils/syncData'
import { useSyncStore } from '../store/syncStore'

export function useSync() {
  const { pendingItems, errorItems, setPendingItems, setErrorItems } = useSyncStore()
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const loadStats = useCallback(() => {
    setPendingItems(syncService.getPending())
    setErrorItems(syncService.getErrors())
  }, [setPendingItems, setErrorItems])

  useEffect(() => { loadStats() }, [loadStats])

  const triggerSync = useCallback(async () => {
    try {
      setIsLoading(true)
      await syncData()
      setLastSync(new Date())
      loadStats()
    } catch (e) {
      console.error('Failed to sync', e)
    } finally {
      setIsLoading(false)
    }
  }, [loadStats])

  return { pendingItems, errorItems, isLoading, lastSync, triggerSync, reload: loadStats }
}
