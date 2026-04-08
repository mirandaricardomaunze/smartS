import { useState, useCallback, useEffect } from 'react'
import { productsRepository } from '@/repositories/productsRepository'
import { supplierRepository } from '@/repositories/supplierRepository'
import { Product, Supplier } from '@/types'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { useCompanyStore } from '@/store/companyStore'

export function useSupplierDetails(supplierId: string | null) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [productsCount, setProductsCount] = useState(0)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const lastUpdate = useSyncStore(state => state.lastUpdate)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)

  const loadData = useCallback(() => {
    if (!supplierId || !activeCompanyId) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      // 1. Basic supplier info
      const data = supplierRepository.getById(activeCompanyId, supplierId)
      setSupplier(data)

      // 2. All active products from this supplier
      const allSupplierProducts = productsRepository.getAll(activeCompanyId, 1000, 0)
        .filter(p => p.supplier_id === supplierId)
      
      setProductsCount(allSupplierProducts.length)

      // 3. Low stock products from this supplier
      const lowStock = allSupplierProducts.filter(p => p.current_stock <= p.minimum_stock)
      setLowStockProducts(lowStock)
    } finally {
      setIsLoading(false)
    }
  }, [supplierId, activeCompanyId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (lastUpdate > 0) {
      loadData()
    }
  }, [lastUpdate, loadData])

  return { 
    supplier, 
    productsCount, 
    lowStockProducts, 
    isLoading, 
    refresh: loadData 
  }
}
