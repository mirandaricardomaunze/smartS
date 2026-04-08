import { useState, useEffect } from 'react'
import { movementsService } from '@/features/movements/services/movementsService'
import { StockMovement } from '@/types'
import { useSyncStore } from '@/features/sync/store/syncStore'

export function useMovementDetails(movementId: string | null) {
  const [movement, setMovement] = useState<(StockMovement & { product_name: string }) | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const lastUpdate = useSyncStore(state => state.lastUpdate)

  const loadData = () => {
    if (!movementId) return
    
    setIsLoading(true)
    try {
      const data = movementsService.getById(movementId)
      setMovement(data)
    } catch (e) {
      console.error('Error loading movement details:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [movementId])

  useEffect(() => {
    if (lastUpdate > 0) {
        loadData()
    }
  }, [lastUpdate])

  return { movement, isLoading, refresh: loadData }
}
