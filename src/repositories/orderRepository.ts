import { db } from '../database/sqlite'
import { Order, OrderItem } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'
import { movementsRepository } from './movementsRepository'

export const orderRepository = {
  getNextNumber: (companyId: string): string => {
    const result = db.getFirstSync<{ maxNum: number | null }>(
      'SELECT MAX(CAST(number AS INTEGER)) as maxNum FROM orders WHERE company_id = ?',
      [companyId]
    )
    const next = (result?.maxNum || 0) + 1
    return String(next).padStart(4, '0')
  },

  getAll: (companyId: string, limit: number = 20, offset: number = 0, status?: string): Order[] => {
    if (status) {
      return db.getAllSync<Order>(
        'SELECT * FROM orders WHERE company_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [companyId, status, limit, offset]
      )
    }
    return db.getAllSync<Order>(
      'SELECT * FROM orders WHERE company_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [companyId, limit, offset]
    )
  },

  getById: (companyId: string, id: string): Order | null => {
    return db.getFirstSync<Order>(
      'SELECT * FROM orders WHERE id = ? AND company_id = ?',
      [id, companyId]
    ) ?? null
  },

  getOrderItems: (companyId: string, orderId: string): (OrderItem & { name: string; reference: string | null })[] => {
    return db.getAllSync<OrderItem & { name: string; reference: string | null }>(
      `SELECT oi.*, p.name, p.reference
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ? AND o.company_id = ?`,
      [orderId, companyId]
    )
  },

  create: (
    order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ): Order => {
    const orderId = generateUUID()
    const now = new Date().toISOString()
    const newOrder: Order = { ...order, id: orderId, created_at: now, updated_at: now, synced: 0 }

    db.runSync('BEGIN TRANSACTION')
    try {
      db.runSync(
        `INSERT INTO orders (id, company_id, customer_id, customer_name, user_id, number, status,
          total_amount, discount, tax_amount, notes, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          orderId, order.company_id, order.customer_id, order.customer_name,
          order.user_id, order.number, order.status, order.total_amount,
          order.discount, order.tax_amount, order.notes, now, now,
        ]
      )

      for (const item of items) {
        const itemId = generateUUID()
        db.runSync(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, tax_rate, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, orderId, item.product_id, item.quantity, item.unit_price, item.tax_rate, item.total]
        )

        // Automatic stock movement — exit on sale
        movementsRepository.create({
          company_id: order.company_id,
          product_id: item.product_id,
          type: 'exit',
          quantity: item.quantity,
          user_id: order.user_id,
          reason: `Venda - Pedido #${order.number}`,
        })
      }

      // Sync queue is added INSIDE the transaction so it either commits with the order or rolls back
      syncRepository.addToQueue('orders', 'INSERT', { ...newOrder, items })

      db.runSync('COMMIT')
      return newOrder
    } catch (e) {
      db.runSync('ROLLBACK')
      throw e
    }
  },

  updateStatus: (companyId: string, id: string, status: Order['status']): void => {
    const now = new Date().toISOString()
    db.runSync(
      'UPDATE orders SET status = ?, updated_at = ?, synced = 0 WHERE id = ? AND company_id = ?',
      [status, now, id, companyId]
    )
    const updated = db.getFirstSync<Order>(
      'SELECT * FROM orders WHERE id = ? AND company_id = ?',
      [id, companyId]
    )
    if (updated) syncRepository.addToQueue('orders', 'UPDATE', updated)
  },

  getByCustomerId: (companyId: string, customerId: string, limit: number = 10): Order[] => {
    return db.getAllSync<Order>(
      'SELECT * FROM orders WHERE company_id = ? AND customer_id = ? ORDER BY created_at DESC LIMIT ?',
      [companyId, customerId, limit]
    )
  },
}
