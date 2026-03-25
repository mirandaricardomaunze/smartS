import { orderRepository } from '@/repositories/orderRepository'
import { productsRepository } from '@/repositories/productsRepository'
import { movementsRepository } from '@/repositories/movementsRepository'
import { invoiceRepository } from '@/repositories/invoiceRepository'
import { Order, OrderItem, Invoice, NoteType } from '@/types'

export const orderService = {
  /**
   * Creates a new order and automatically handles inventory and invoicing
   */
  createProfessionalOrder: async (
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ) => {
    // 1. Create the order in the repository with 'pending' status
    // In this new flow, pending orders do NOT subtract stock.
    const order = await orderRepository.create(orderData, items)

    // 2. Automatically generate a draft invoice (optional for pending)
    const invoice: Omit<Invoice, 'id' | 'created_at' | 'synced'> = {
      company_id: order.company_id,
      order_id: order.id,
      customer_id: order.customer_id!,
      number: `FT-${order.number}`,
      type: 'invoice',
      status: 'draft',
      total_amount: order.total_amount,
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    await invoiceRepository.create(invoice)

    // 3. Trigger notification for the group
    const { notificationService } = require('@/features/notifications/services/notificationService')
    await notificationService.checkNewOrders()

    return order
  },

  /**
   * Starts the picking process and locks the stock
   */
  startPicking: async (orderId: string) => {
    const order = orderRepository.getById(orderId)
    if (!order || order.status !== 'pending') return

    const items = orderRepository.getOrderItems(orderId)

    // Lock stock (deduct it from inventory)
    // The movementsRepository.create already handles product stock updates.
    for (const item of items) {
      await movementsRepository.create({
        company_id: order.company_id,
        product_id: item.product_id,
        type: 'exit',
        quantity: item.quantity,
        user_id: order.user_id,
        reason: `Separação - Pedido #${order.number}`
      })
    }

    // Update status to 'picking'
    orderRepository.updateStatus(orderId, 'picking')
  },

  /**
   * Finalizes the order
   */
  finishOrder: async (orderId: string) => {
    const order = orderRepository.getById(orderId)
    if (!order || (order.status !== 'picking' && order.status !== 'pending')) return

    // If it was still pending, lock stock first
    if (order.status === 'pending') {
      await orderService.startPicking(orderId)
    }

    // Update status to 'completed'
    orderRepository.updateStatus(orderId, 'completed')

    // Update invoice status to issued
    const invoice = invoiceRepository.getByOrderId(orderId)
    if (invoice) {
        await invoiceRepository.updateStatus(invoice.id, 'issued')
    }
  },

  /**
   * Cancels an order and restores stock
   */
  cancelOrder: async (orderId: string, userId: string) => {
    const order = orderRepository.getById(orderId)
    if (!order || order.status === 'cancelled') return

    const items = orderRepository.getOrderItems(orderId)

    // 1. Restore stock ONLY if it was subtracted (picking or completed)
    // The movementsRepository.create already handles product stock updates.
    if (order.status === 'picking' || order.status === 'completed') {
      for (const item of items) {
        await movementsRepository.create({
          company_id: order.company_id,
          product_id: item.product_id,
          type: 'entry',
          quantity: item.quantity,
          user_id: userId,
          reason: `Cancelamento de Pedido #${order.number}`
        })
      }
    }

    // 2. Update order status
    await orderRepository.updateStatus(orderId, 'cancelled')
    
    // 3. Update invoice status if exists
    const invoice = invoiceRepository.getByOrderId(orderId)
    if (invoice) {
      await invoiceRepository.updateStatus(invoice.id, 'cancelled')
    }
  },

  /**
   * Processes a direct POS sale: Create order + Record movements + Update stock + Issue Invoice
   */
  processPosSale: async (
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ) => {
    // 1. Create the order with 'completed' status immediately
    const order = await orderRepository.create({
      ...orderData,
      status: 'completed'
    }, items)

    // 2. Process stock movements for each item
    // The movementsRepository.create already updates the product stock internally.
    for (const item of items) {
      await movementsRepository.create({
        company_id: order.company_id,
        product_id: item.product_id,
        type: 'exit',
        quantity: item.quantity,
        user_id: order.user_id,
        reason: `Venda Direta (PDV) - Pedido #${order.number}`
      })
    }

    // 3. Create and finalize invoice immediately
    const invoice: Omit<Invoice, 'id' | 'created_at' | 'synced'> = {
      company_id: order.company_id,
      order_id: order.id,
      customer_id: order.customer_id!,
      number: `V-FT-${order.number}`,
      type: 'invoice',
      status: 'issued',
      total_amount: order.total_amount,
      due_date: new Date().toISOString() // Paid immediately
    }
    
    await invoiceRepository.create(invoice)

    return order
  }
}
