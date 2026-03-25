import { useState, useEffect, useCallback } from 'react'
import { expiryService } from '../services/expiryService'
import { ExpiryLot } from '@/types'

export function useExpiry(productId?: string) {
  const [lots, setLots] = useState<ExpiryLot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      const data = productId ? expiryService.getByProductId(productId) : expiryService.getAll()
      setLots(data)
    } catch (e) {
      setError('Erro ao carregar lotes de validade')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => { load() }, [load])

  const createLot = useCallback(async (data: Parameters<typeof expiryService.create>[0]) => {
    try {
      const lot = expiryService.create(data)
      setLots(prev => [...prev, lot])
      return lot
    } catch (e: any) {
      const message = e.message || 'Erro ao criar lote'
      setError(message)
      throw e
    }
  }, [])
  
  const deleteLot = useCallback(async (id: string) => {
     try {
       expiryService.delete(id)
       load()
     } catch (e: any) {
       const message = e.message || 'Erro ao apagar lote'
       setError(message)
       throw e
     }
  }, [load])

  return { lots, isLoading, error, createLot, deleteLot, reload: load }
}
