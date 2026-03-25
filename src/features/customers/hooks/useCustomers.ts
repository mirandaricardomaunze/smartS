import { useState, useCallback } from 'react'
import { customersService } from '../services/customersService'
import { Customer } from '@/types'
import { useCompanyStore } from '@/store/companyStore'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)

  const fetchCustomers = useCallback(() => {
    setIsLoading(true)
    try {
      const data = customersService.getAll()
      setCustomers(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createCustomer = async (data: Omit<Customer, 'id' | 'created_at' | 'synced'>) => {
    const newCustomer = customersService.create(data)
    fetchCustomers()
    return newCustomer
  }

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    customersService.update(id, data)
    fetchCustomers()
  }

  const deleteCustomer = async (id: string) => {
    customersService.delete(id)
    fetchCustomers()
  }

  return {
    customers,
    isLoading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
}
