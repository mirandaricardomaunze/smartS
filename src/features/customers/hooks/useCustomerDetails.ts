import { useState, useCallback, useEffect } from 'react'
import { customersService } from '../services/customersService'
import { Customer, Order } from '@/types'
import { useSyncStore } from '@/features/sync/store/syncStore'

export function useCustomerDetails(customerId: string | null) {
  const [customer, setCustomer] = useState<(Customer & { order_count: number }) | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const lastUpdate = useSyncStore(state => state.lastUpdate)

  const fetchDetails = useCallback(async () => {
    if (!customerId) return
    setIsLoading(true)
    try {
      const data = customersService.getById(customerId)
      const orders = customersService.getRecentOrders(customerId)
      setCustomer(data)
      setRecentOrders(orders)
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    if (customerId) fetchDetails()
  }, [customerId, fetchDetails])

  useEffect(() => {
    if (lastUpdate > 0 && customerId) fetchDetails()
  }, [lastUpdate, customerId, fetchDetails])

  return {
    customer,
    recentOrders,
    isLoading,
    refresh: fetchDetails
  }
}
