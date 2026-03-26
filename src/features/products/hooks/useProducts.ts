import { useState, useEffect, useCallback } from 'react'
import { productsService } from '../services/productsService'
import { Product } from '@/types'
import { useSyncStore } from '@/features/sync/store/syncStore'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  const load = useCallback((isInitial = true) => {
    try {
      setIsLoading(true)
      setError(null)
      const currentOffset = isInitial ? 0 : page * PAGE_SIZE
      const data = productsService.getAll(PAGE_SIZE, currentOffset)
      
      if (isInitial) {
        setProducts(data)
        setPage(1)
      } else {
        setProducts(prev => [...prev, ...data])
        setPage(prev => prev + 1)
      }
      
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      setError('Erro ao carregar produtos')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      load(false)
    }
  }, [isLoading, hasMore, load])

  useEffect(() => { load() }, [load])

  // Listen for realtime updates
  const lastUpdate = useSyncStore(state => state.lastUpdate)
  useEffect(() => {
    if (lastUpdate > 0) load()
  }, [lastUpdate, load])

  const createProduct = useCallback(async (data: Parameters<typeof productsService.create>[0], batches?: Parameters<typeof productsService.create>[1]) => {
    try {
      const product = productsService.create(data, batches)
      setProducts(prev => [...prev, product])
      return product
    } catch (e: any) {
      const message = e.message || 'Erro ao criar produto'
      setError(message)
      throw e
    }
  }, [])

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    try {
      productsService.update(id, data)
      load() // reload to get freshest local state
    } catch (e: any) {
      const message = e.message || 'Erro ao atualizar produto'
      setError(message)
      throw e
    }
  }, [load])
  
  const deleteProduct = useCallback(async (id: string) => {
    try {
      productsService.delete(id)
      load()
    } catch (e: any) {
      const message = e.message || 'Erro ao apagar produto'
      setError(message)
      throw e
    }
  }, [load])

  return { products, isLoading, error, createProduct, updateProduct, deleteProduct, reload: load, loadMore, hasMore }
}
