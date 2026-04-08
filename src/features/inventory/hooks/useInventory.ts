import { useState, useCallback } from 'react'
import { inventoryService } from '../services/inventoryService'
import { useCompanyStore } from '@/store/companyStore'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Product } from '@/types'
import { productsRepository } from '@/repositories/productsRepository'

interface AuditItem {
  product: Product
  physicalQuantity: number
  difference: number
}

export function useInventory() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auditItems, setAuditItems] = useState<AuditItem[]>([])
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const user = useAuthStore(state => state.user)

  const reconcileStock = useCallback(async (
    productId: string,
    physicalQty: number,
    reason?: string
  ): Promise<void> => {
    if (!activeCompanyId || !user) {
      setError('Empresa ou utilizador não definido')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await inventoryService.reconcileStock(
        productId,
        physicalQty,
        user.id,
        activeCompanyId,
        reason
      )
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro na auditoria'
      setError(message)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId, user])

  const loadProductsForAudit = useCallback((search?: string) => {
    if (!activeCompanyId) return
    setIsLoading(true)
    try {
      const products = productsRepository.getAll(activeCompanyId, 100, 0, search)
      setAuditItems(products.map(p => ({
        product: p,
        physicalQuantity: p.current_stock,
        difference: 0,
      })))
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId])

  const updatePhysicalQuantity = useCallback((productId: string, quantity: number) => {
    setAuditItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          physicalQuantity: quantity,
          difference: quantity - item.product.current_stock,
        }
      }
      return item
    }))
  }, [])

  return {
    isLoading,
    error,
    auditItems,
    reconcileStock,
    loadProductsForAudit,
    updatePhysicalQuantity,
  }
}
