import { useState, useEffect, useCallback, useRef } from 'react'
import { movementsService } from '../services/movementsService'
import { StockMovement, CreateStockMovementData } from '@/types'
import { logger } from '@/utils/logger'

export function useMovements(productId?: string) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(0)
  const PAGE_SIZE = 50

  // Synchronous load — no async needed since service calls are synchronous
  const load = useCallback((isInitial = true) => {
    try {
      setIsLoading(true)
      setError(null)

      if (isInitial) pageRef.current = 0

      const currentOffset = pageRef.current * PAGE_SIZE
      const data = productId
        ? movementsService.getByProductId(productId, PAGE_SIZE, currentOffset)
        : movementsService.getAll(PAGE_SIZE, currentOffset)

      if (isInitial) {
        setMovements(data)
        pageRef.current = 1
      } else {
        setMovements(prev => [...prev, ...data])
        pageRef.current += 1
      }

      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      logger.error('[useMovements] load:', e)
      setError(e instanceof Error ? e.message : 'Erro ao carregar movimentos')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) load(false)
  }, [isLoading, hasMore, load])

  useEffect(() => { load(true) }, [productId])

  const createMovement = useCallback(async (data: CreateStockMovementData) => {
    try {
      const movement = movementsService.create(data)
      setMovements(prev => [movement, ...prev])
      return movement
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao criar movimento'
      logger.error('[useMovements] createMovement:', e)
      setError(message)
      throw e
    }
  }, [])

  return { movements, isLoading, error, createMovement, reload: () => load(true), loadMore, hasMore }
}
