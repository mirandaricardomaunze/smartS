import { db } from '@/database/sqlite'
import { Notification, NotificationType } from '../types'
import { generateUUID } from '@/utils/uuid'

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    return db.getAllSync<Notification>(
      'SELECT * FROM notifications ORDER BY created_at DESC'
    )
  },

  async markAsRead(id: string): Promise<void> {
    db.runSync(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    )
  },

  async markAllAsRead(): Promise<void> {
    db.runSync('UPDATE notifications SET is_read = 1')
  },

  async create(data: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    const id = generateUUID()
    const createdAt = new Date().toISOString()
    
    db.runSync(
      'INSERT INTO notifications (id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 0, ?)',
      [id, data.title, data.message, data.type, createdAt]
    )

    return {
      id,
      ...data,
      is_read: 0,
      created_at: createdAt
    }
  },

  /**
   * Automatically check for low stock and generate notifications.
   * This should be called on app start or dashboard load.
   */
  async checkLowStockAlerts(): Promise<void> {
    const lowStockProducts = db.getAllSync<any>(
      'SELECT name, current_stock, minimum_stock FROM products WHERE is_active = 1 AND current_stock <= minimum_stock'
    )

    for (const product of lowStockProducts) {
      const title = 'Alerta de Stock Baixo'
      const message = `O produto "${product.name}" está com stock baixo (${product.current_stock} ${product.unit || 'un'}).`
      
      // Check if a similar unread notification already exists to avoid spamming
      const existing = db.getFirstSync<any>(
        'SELECT id FROM notifications WHERE title = ? AND message = ? AND is_read = 0',
        [title, message]
      )

      if (!existing) {
        await this.create({
          title,
          message,
          type: 'warning'
        })
      }
    }
  },

  /**
   * Check for new pending orders and generate notifications
   */
  async checkNewOrders(): Promise<void> {
    const pendingOrders = db.getAllSync<any>(
      "SELECT number, customer_name FROM orders WHERE status = 'pending' AND created_at >= datetime('now', '-1 hour')"
    )

    for (const order of pendingOrders) {
      const title = 'Novo Pedido Recebido'
      const message = `Pedido #${order.number} de "${order.customer_name}" aguarda separação.`

      const existing = db.getFirstSync<any>(
        'SELECT id FROM notifications WHERE title = ? AND message = ? AND is_read = 0',
        [title, message]
      )

      if (!existing) {
        await this.create({
          title,
          message,
          type: 'info'
        })
      }
    }
  },
  
  /**
   * Check for products expiring within the next 30 days
   */
  async checkExpiryAlerts(): Promise<void> {
    const productsNearExpiry = db.getAllSync<any>(
      "SELECT name, expiry_date FROM products WHERE is_active = 1 AND expiry_date IS NOT NULL AND expiry_date <= date('now', '+30 days') AND expiry_date >= date('now')"
    )

    for (const product of productsNearExpiry) {
      const title = 'Produto Próximo do Vencimento'
      const dateStr = new Date(product.expiry_date).toLocaleDateString('pt-PT')
      const message = `O produto "${product.name}" expira em ${dateStr}.`
      
      const existing = db.getFirstSync<any>(
        'SELECT id FROM notifications WHERE title = ? AND message = ? AND is_read = 0',
        [title, message]
      )

      if (!existing) {
        await this.create({
          title,
          message,
          type: 'warning'
        })
      }
    }
  }
}
