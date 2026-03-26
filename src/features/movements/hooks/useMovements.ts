import { useState, useEffect, useCallback } from 'react'
import { movementsService } from '../services/movementsService'
import { StockMovement } from '@/types'

export function useMovements(productId?: string) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 50

  const load = useCallback((isInitial = true) => {
    try {
      setIsLoading(true)
      setError(null)
      const currentOffset = isInitial ? 0 : page * PAGE_SIZE
      const data = productId 
        ? movementsService.getByProductId(productId, PAGE_SIZE, currentOffset) 
        : movementsService.getAll(PAGE_SIZE, currentOffset)
      
      if (isInitial) {
        setMovements(data)
        setPage(1)
      } else {
        setMovements(prev => [...prev, ...data])
        setPage(prev => prev + 1)
      }
      
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      setError('Erro ao carregar movimentos')
    } finally {
      setIsLoading(false)
    }
  }, [productId, page])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      load(false)
    }
  }, [isLoading, hasMore, load])

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

  return { movements, isLoading, error, createMovement, reload: load, loadMore, hasMore }
}
