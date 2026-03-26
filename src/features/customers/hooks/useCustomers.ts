import { useState, useCallback } from 'react'
import { customersService } from '../services/customersService'
import { Customer } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { useEffect } from 'react'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  const fetchCustomers = useCallback((isInitial = true) => {
    if (!activeCompanyId) return
    setIsLoading(true)
    try {
      const currentOffset = isInitial ? 0 : page * PAGE_SIZE
      const data = customersService.getAll(PAGE_SIZE, currentOffset)
      
      if (isInitial) {
        setCustomers(data)
        setPage(1)
      } else {
        setCustomers(prev => [...prev, ...data])
        setPage(prev => prev + 1)
      }
      
      setHasMore(data.length === PAGE_SIZE)
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId, page])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchCustomers(false)
    }
  }, [isLoading, hasMore, fetchCustomers])

  // Initial fetch
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Listen for realtime updates
  const lastUpdate = useSyncStore(state => state.lastUpdate)
  useEffect(() => {
    if (lastUpdate > 0) fetchCustomers()
  }, [lastUpdate, fetchCustomers])

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
    deleteCustomer,
    loadMore,
    hasMore
  }
}
