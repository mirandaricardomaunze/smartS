import { useState, useEffect, useCallback } from 'react'
import { movementsService } from '../services/movementsService'
import { StockMovement } from '@/types'

export function useMovements(productId?: string) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      const data = productId ? movementsService.getByProductId(productId) : movementsService.getAll()
      setMovements(data)
    } catch (e) {
      setError('Erro ao carregar movimentos')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => { load() }, [load])

  const createMovement = useCallback(async (data: Parameters<typeof movementsService.create>[0]) => {
    try {
      const movement = movementsService.create(data)
      setMovements(prev => [movement, ...prev])
      return movement
    } catch (e: any) {
      const message = e.message || 'Erro ao criar movimento'
      setError(message)
      throw e
    }
  }, [])

  return { movements, isLoading, error, createMovement, reload: load }
}
