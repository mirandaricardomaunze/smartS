import { useState, useEffect, useCallback, useRef } from 'react'
import { productsService } from '../services/productsService'
import { Product } from '@/types'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { logger } from '@/utils/logger'

export function useProducts(search: string = '') {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(0)
  const PAGE_SIZE = 20

  const load = useCallback((isInitial = true) => {
    try {
      setIsLoading(true)
      setError(null)

      if (isInitial) pageRef.current = 0

      const currentOffset = pageRef.current * PAGE_SIZE
      const data = productsService.getAll(PAGE_SIZE, currentOffset, search)

      if (isInitial) {
        setProducts(data)
        pageRef.current = 1
      } else {
        setProducts(prev => [...prev, ...data])
        pageRef.current += 1
      }

      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      logger.error('[useProducts] load:', e)
      setError(e instanceof Error ? e.message : 'Erro ao carregar produtos')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) load(false)
  }, [isLoading, hasMore, load])

  // Load on mount or when search changes (debounced)
  useEffect(() => {
    const handler = setTimeout(() => load(true), search ? 500 : 0)
    return () => clearTimeout(handler)
  }, [search])

  // Reload on realtime sync updates
  const lastUpdate = useSyncStore(state => state.lastUpdate)
  useEffect(() => {
    if (lastUpdate > 0) load(true)
  }, [lastUpdate])

  const createProduct = useCallback(async (
    data: Parameters<typeof productsService.create>[0],
    batches?: Parameters<typeof productsService.create>[1]
  ) => {
    try {
      const product = productsService.create(data, batches)
      if (!search || product.name.toLowerCase().includes(search.toLowerCase())) {
        setProducts(prev => [product, ...prev])
      }
      return product
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao criar produto'
      logger.error('[useProducts] createProduct:', e)
      setError(message)
      throw e
    }
  }, [search])

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    try {
      productsService.update(id, data)
      load(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao actualizar produto'
      logger.error('[useProducts] updateProduct:', e)
      setError(message)
      throw e
    }
  }, [load])

  const deleteProduct = useCallback(async (id: string) => {
    try {
      productsService.delete(id)
      load(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao apagar produto'
      logger.error('[useProducts] deleteProduct:', e)
      setError(message)
      throw e
    }
  }, [load])

  return { products, isLoading, error, createProduct, updateProduct, deleteProduct, reload: () => load(true), loadMore, hasMore }
}
