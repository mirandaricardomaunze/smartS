import { orderRepository } from '@/repositories/orderRepository'
import { movementsRepository } from '@/repositories/movementsRepository'
import { invoiceRepository } from '@/repositories/invoiceRepository'
import { notificationService } from '@/features/notifications/services/notificationService'
import { Order, OrderItem, Invoice } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { validate } from '@/utils/validation'

export const orderService = {
  getAll(limit: number = 20, offset: number = 0, status?: string): Order[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return orderRepository.getAll(activeCompanyId, limit, offset, status)
  },

  getById(id: string): Order | null {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return null
    return orderRepository.getById(activeCompanyId, id)
  },

  getOrderItems(orderId: string): (OrderItem & { name: string; reference: string | null })[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return orderRepository.getOrderItems(activeCompanyId, orderId)
  },

  /**
   * Creates a new order and automatically handles invoicing.
   * Stock is decremented inside orderRepository.create() transactionally.
   */
  async createProfessionalOrder(
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ): Promise<Order> {
    validate.order({ total_amount: orderData.total_amount, items })

    const order = await orderRepository.create(orderData, items)

    const invoice: Omit<Invoice, 'id' | 'created_at' | 'synced'> = {
      company_id: order.company_id,
      order_id: order.id,
      customer_id: order.customer_id ?? '',
      number: `FT-${order.number}`,
      type: 'invoice',
      status: 'draft',
      total_amount: order.total_amount,
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    }

    await invoiceRepository.create(invoice)
    await notificationService.checkNewOrders(order.company_id)

    return order
  },

  /**
   * Starts the picking process for a pending order.
   * If any item movement fails the whole picking is aborted — no partial stock exit.
   */
  async startPicking(companyId: string, orderId: string): Promise<void> {
    const order = orderRepository.getById(companyId, orderId)
    if (!order) throw new Error('Pedido não encontrado')
    if (order.status !== 'pending') throw new Error('Pedido não está em estado pendente')

    const items = orderRepository.getOrderItems(companyId, orderId)
    if (items.length === 0) throw new Error('Pedido sem itens')

    const createdMovements: string[] = []

    try {
      for (const item of items) {
        const movement = await movementsRepository.create({
          company_id: companyId,
          product_id: item.product_id,
          type: 'exit',
          quantity: item.quantity,
          user_id: order.user_id,
          reason: `Separação - Pedido #${order.number}`,
        })
        createdMovements.push(movement.id)
      }

      orderRepository.updateStatus(companyId, orderId, 'picking')
    } catch (e) {
      // Rollback: restore stock for movements that succeeded before the failure
      for (const movementId of createdMovements) {
        try {
          const mov = movementsRepository.getById(companyId, movementId)
          if (mov) {
            await movementsRepository.create({
              company_id: companyId,
              product_id: mov.product_id,
              type: 'entry',
              quantity: mov.quantity,
              user_id: order.user_id,
              reason: `Reversão de Separação - Pedido #${order.number}`,
            })
          }
        } catch {
          // Best-effort rollback — log but don't mask the original error
        }
      }
      throw e
    }
  },

  /**
   * Finalizes a picked or pending order.
   */
  async finishOrder(companyId: string, orderId: string): Promise<void> {
    const order = orderRepository.getById(companyId, orderId)
    if (!order) throw new Error('Pedido não encontrado')
    if (order.status !== 'picking' && order.status !== 'pending') {
      throw new Error('Pedido não pode ser finalizado no estado actual')
    }

    if (order.status === 'pending') {
      await orderService.startPicking(companyId, orderId)
    }

    orderRepository.updateStatus(companyId, orderId, 'completed')

    const invoice = invoiceRepository.getByOrderId(companyId, orderId)
    if (invoice) await invoiceRepository.updateStatus(companyId, invoice.id, 'issued')
  },

  /**
   * Cancels an order and restores stock if picking had already started.
   */
  async cancelOrder(companyId: string, orderId: string, userId: string): Promise<void> {
    const order = orderRepository.getById(companyId, orderId)
    if (!order) throw new Error('Pedido não encontrado')
    if (order.status === 'cancelled') throw new Error('Pedido já está cancelado')

    const items = orderRepository.getOrderItems(companyId, orderId)

    if (order.status === 'picking' || order.status === 'completed') {
      for (const item of items) {
        await movementsRepository.create({
          company_id: companyId,
          product_id: item.product_id,
          type: 'entry',
          quantity: item.quantity,
          user_id: userId,
          reason: `Cancelamento de Pedido #${order.number}`,
        })
      }
    }

    await orderRepository.updateStatus(companyId, orderId, 'cancelled')

    const invoice = invoiceRepository.getByOrderId(companyId, orderId)
    if (invoice) await invoiceRepository.updateStatus(companyId, invoice.id, 'cancelled')
  },

  /**
   * Processes a direct POS sale: creates order + movements + invoice atomically.
   */
  async processPosSale(
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ): Promise<Order> {
    validate.order({ total_amount: orderData.total_amount, items })

    const order = await orderRepository.create({ ...orderData, status: 'completed' }, items)

    for (const item of items) {
      await movementsRepository.create({
        company_id: order.company_id,
        product_id: item.product_id,
        type: 'exit',
        quantity: item.quantity,
        user_id: order.user_id,
        reason: `Venda Direta (PDV) - Pedido #${order.number}`,
      })
    }

    const invoice: Omit<Invoice, 'id' | 'created_at' | 'synced'> = {
      company_id: order.company_id,
      order_id: order.id,
      customer_id: order.customer_id ?? '',
      number: `V-FT-${order.number}`,
      type: 'invoice',
      status: 'issued',
      total_amount: order.total_amount,
      due_date: new Date().toISOString(),
    }

    await invoiceRepository.create(invoice)

    return order
  },
}
