import { useState, useCallback } from 'react'
import { orderRepository } from '@/repositories/orderRepository'
import { orderService } from '@/services/orderService'
import { Order, OrderItem } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { useEffect } from 'react'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  const fetchOrders = useCallback((isInitial = true) => {
    if (!activeCompanyId) return
    
    setIsLoading(true)
    try {
      const currentOffset = isInitial ? 0 : page * PAGE_SIZE
      const data = orderService.getAll(PAGE_SIZE, currentOffset)
      
      if (isInitial) {
        setOrders(data)
        setPage(1)
      } else {
        setOrders(prev => [...prev, ...data])
        setPage(prev => prev + 1)
      }
      
      setHasMore(data.length === PAGE_SIZE)
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId, page])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchOrders(false)
    }
  }, [isLoading, hasMore, fetchOrders])

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Listen for realtime updates
  const lastUpdate = useSyncStore(state => state.lastUpdate)
  useEffect(() => {
    if (lastUpdate > 0) fetchOrders()
  }, [lastUpdate, fetchOrders])

  const createOrder = async (orderData: any, items: any[]) => {
    setIsLoading(true)
    try {
      const order = await orderService.createProfessionalOrder(orderData, items)
      fetchOrders()
      return order
    } finally {
      setIsLoading(false)
    }
  }

  const cancelOrder = async (orderId: string, userId: string) => {
    if (activeCompanyId) {
      await orderService.cancelOrder(activeCompanyId, orderId, userId)
      fetchOrders()
    }
  }

  const startPicking = async (orderId: string) => {
    if (activeCompanyId) {
      await orderService.startPicking(activeCompanyId, orderId)
      fetchOrders()
    }
  }

  const finishOrder = async (orderId: string) => {
    if (activeCompanyId) {
      await orderService.finishOrder(activeCompanyId, orderId)
      fetchOrders()
    }
  }

  return {
    orders,
    isLoading,
    fetchOrders,
    createOrder,
    cancelOrder,
    startPicking,
    finishOrder,
    loadMore,
    hasMore
  }
}
