import { db } from '../database/sqlite'
import { Order, OrderItem } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const orderRepository = {
  getAll: (companyId: string): Order[] => {
    return db.getAllSync<Order>(
      'SELECT * FROM orders WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    )
  },

  getById: (id: string): Order | null => {
    return db.getFirstSync<Order>('SELECT * FROM orders WHERE id = ?', [id])
  },

  getOrderItems: (orderId: string): OrderItem[] => {
    return db.getAllSync<OrderItem>('SELECT * FROM order_items WHERE order_id = ?', [orderId])
  },

  create: (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'synced'>, items: Omit<OrderItem, 'id' | 'order_id'>[]): Order => {
    const orderId = generateUUID()
    const now = new Date().toISOString()
    
    // Start transaction
    db.runSync('BEGIN TRANSACTION')
    try {
      db.runSync(
        `INSERT INTO orders (id, company_id, customer_id, customer_name, user_id, number, status, total_amount, discount, tax_amount, notes, created_at, updated_at, synced) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [orderId, order.company_id, order.customer_id, order.customer_name, order.user_id, order.number, order.status, order.total_amount, order.discount, order.tax_amount, order.notes, now, now]
      )

      for (const item of items) {
        const itemId = generateUUID()
        db.runSync(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, tax_rate, total) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, orderId, item.product_id, item.quantity, item.unit_price, item.tax_rate, item.total]
        )
      }

      db.runSync('COMMIT')
      
      const newOrder: Order = { ...order, id: orderId, created_at: now, updated_at: now, synced: 0 }
      syncRepository.addToQueue('orders', 'INSERT', { ...newOrder, items })
      
      return newOrder
    } catch (e) {
      db.runSync('ROLLBACK')
      throw e
    }
  },

  updateStatus: (id: string, status: Order['status']): void => {
    const now = new Date().toISOString()
    db.runSync('UPDATE orders SET status = ?, updated_at = ?, synced = 0 WHERE id = ?', [status, now, id])
    
    const updated = db.getFirstSync<Order>('SELECT * FROM orders WHERE id = ?', [id])
    if (updated) {
      syncRepository.addToQueue('orders', 'UPDATE', updated)
    }
  }
}
