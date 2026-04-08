import { useState, useCallback, useEffect, useRef } from 'react'
import { orderService } from '@/services/orderService'
import { Order, OrderItem } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { logger } from '@/utils/logger'

const PAGE_SIZE = 25

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(0)
  const isMounted = useRef(true)

  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const lastUpdate = useSyncStore(state => state.lastUpdate)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchOrders = useCallback((isInitial = true, showFullLoading = true) => {
    if (!activeCompanyId) return

    if (isInitial && showFullLoading && isMounted.current) setIsLoading(true)

    try {
      if (isInitial) pageRef.current = 0

      const offset = pageRef.current * PAGE_SIZE
      const data = orderService.getAll(PAGE_SIZE, offset)

      if (isMounted.current) {
        if (isInitial) {
          setOrders(data)
        } else {
          setOrders(prev => [...prev, ...data])
        }
        setHasMore(data.length === PAGE_SIZE)
        pageRef.current += 1
      }
    } catch (e) {
      logger.error('[useOrders] fetchOrders:', e)
    } finally {
      if (isInitial && showFullLoading && isMounted.current) setIsLoading(false)
    }
  }, [activeCompanyId])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) fetchOrders(false)
  }, [isLoading, hasMore, fetchOrders])

  useEffect(() => {
    fetchOrders(true, true)
  }, [activeCompanyId, fetchOrders])

  useEffect(() => {
    if (lastUpdate <= 0) return
    const timeout = setTimeout(() => fetchOrders(true, false), 500)
    return () => clearTimeout(timeout)
  }, [lastUpdate, fetchOrders])

  const createOrder = useCallback(async (
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ) => {
    if (isMounted.current) setIsLoading(true)
    try {
      const order = await orderService.createProfessionalOrder(orderData, items)
      fetchOrders(true, false)
      return order
    } catch (e) {
      logger.error('[useOrders] createOrder:', e)
      throw e
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [fetchOrders])

  const startPicking = useCallback(async (orderId: string) => {
    if (!activeCompanyId) return
    try {
      await orderService.startPicking(activeCompanyId, orderId)
      fetchOrders(true, false)
    } catch (e) {
      logger.error('[useOrders] startPicking:', e)
      throw e
    }
  }, [activeCompanyId, fetchOrders])

  const finishOrder = useCallback(async (orderId: string) => {
    if (!activeCompanyId) return
    try {
      await orderService.finishOrder(activeCompanyId, orderId)
      fetchOrders(true, false)
    } catch (e) {
      logger.error('[useOrders] finishOrder:', e)
      throw e
    }
  }, [activeCompanyId, fetchOrders])

  const cancelOrder = useCallback(async (orderId: string, userId: string) => {
    if (!activeCompanyId) return
    try {
      await orderService.cancelOrder(activeCompanyId, orderId, userId)
      fetchOrders(true, false)
    } catch (e) {
      logger.error('[useOrders] cancelOrder:', e)
      throw e
    }
  }, [activeCompanyId, fetchOrders])

  return { orders, isLoading, hasMore, fetchOrders, loadMore, createOrder, startPicking, finishOrder, cancelOrder }
}
