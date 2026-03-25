import { useState, useCallback } from 'react'
import { orderRepository } from '@/repositories/orderRepository'
import { orderService } from '@/services/orderService'
import { Order, OrderItem } from '@/types'
import { useCompanyStore } from '@/store/companyStore'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)

  const fetchOrders = useCallback(() => {
    if (!activeCompanyId) return
    setIsLoading(true)
    try {
      const data = orderRepository.getAll(activeCompanyId)
      setOrders(data)
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId])

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
    await orderService.cancelOrder(orderId, userId)
    fetchOrders()
  }

  const startPicking = async (orderId: string) => {
    await orderService.startPicking(orderId)
    fetchOrders()
  }

  const finishOrder = async (orderId: string) => {
    await orderService.finishOrder(orderId)
    fetchOrders()
  }

  return {
    orders,
    isLoading,
    fetchOrders,
    createOrder,
    cancelOrder,
    startPicking,
    finishOrder
  }
}
