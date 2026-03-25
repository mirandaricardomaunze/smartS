import { useState, useEffect, useCallback } from 'react'
import { productsService } from '../services/productsService'
import { Product } from '@/types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      const data = productsService.getAll()
      setProducts(data)
    } catch (e) {
      setError('Erro ao carregar produtos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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

  return { products, isLoading, error, createProduct, updateProduct, deleteProduct, reload: load }
}
