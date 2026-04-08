import { useState, useEffect } from 'react'
import { orderService } from '@/services/orderService'
import { Order, OrderItem } from '@/types'
import { useSyncStore } from '@/features/sync/store/syncStore'

export function useOrderDetails(orderId: string | string[] | undefined) {
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<(OrderItem & { name: string, reference: string | null })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastUpdate = useSyncStore(state => state.lastUpdate)

  const loadData = () => {
    if (!orderId || typeof orderId !== 'string') {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const orderData = orderService.getById(orderId)
      if (orderData) {
        setOrder(orderData)
        const itemsData = orderService.getOrderItems(orderId)
        setItems(itemsData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [orderId])

  useEffect(() => {
    if (lastUpdate > 0) {
        loadData()
    }
  }, [lastUpdate])

  return { order, items, isLoading, refresh: loadData }
}
