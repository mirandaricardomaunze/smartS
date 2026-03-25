import { useState, useCallback } from 'react'
import { suppliersService } from '../services/suppliersService'
import { Supplier } from '@/types'
import { useCompanyStore } from '@/store/companyStore'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)

  const fetchSuppliers = useCallback(() => {
    setIsLoading(true)
    try {
      const data = suppliersService.getAll()
      setSuppliers(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSupplier = async (data: Omit<Supplier, 'id' | 'created_at' | 'synced'>) => {
    const newSupplier = suppliersService.create(data)
    fetchSuppliers()
    return newSupplier
  }

  const updateSupplier = async (id: string, data: Partial<Supplier>) => {
    suppliersService.update(id, data)
    fetchSuppliers()
  }

  const deleteSupplier = async (id: string) => {
    suppliersService.delete(id)
    fetchSuppliers()
  }

  return {
    suppliers,
    isLoading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  }
}
