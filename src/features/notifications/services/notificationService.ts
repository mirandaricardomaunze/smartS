import * as Notifications from 'expo-notifications'
import { db } from '@/database/sqlite'
import { Notification, NotificationType } from '../types'
import { generateUUID } from '@/utils/uuid'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  async getAll(companyId: string): Promise<Notification[]> {
    return db.getAllSync<Notification>(
      'SELECT * FROM notifications WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
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

  async create(data: Omit<Notification, 'id' | 'created_at' | 'is_read'> & { company_id: string }): Promise<Notification> {
    const id = generateUUID()
    const createdAt = new Date().toISOString()
    
    db.runSync(
      'INSERT INTO notifications (id, company_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [id, data.company_id, data.title, data.message, data.type, createdAt]
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
  async checkLowStockAlerts(companyId: string): Promise<void> {
    const lowStockProducts = db.getAllSync<any>(
      'SELECT name, current_stock, minimum_stock FROM products WHERE company_id = ? AND is_active = 1 AND current_stock <= minimum_stock',
      [companyId]
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
          company_id: companyId,
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
  async checkNewOrders(companyId: string): Promise<void> {
    const pendingOrders = db.getAllSync<any>(
      "SELECT number, customer_name FROM orders WHERE company_id = ? AND status = 'pending' AND created_at >= datetime('now', '-1 hour')",
      [companyId]
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
          company_id: companyId,
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
  async checkExpiryAlerts(companyId: string): Promise<void> {
    const productsNearExpiry = db.getAllSync<any>(
      "SELECT name, expiry_date FROM products WHERE company_id = ? AND is_active = 1 AND expiry_date IS NOT NULL AND expiry_date <= date('now', '+30 days') AND expiry_date >= date('now')",
      [companyId]
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
          company_id: companyId,
          title,
          message,
          type: 'warning'
        })

        // Also trigger a system-level notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⚠️ ${title}`,
            body: message,
            data: { screen: 'expiry' },
          },
          trigger: null,
        });
      }
    }
  },

  async scheduleNotification(title: string, body: string, data: any = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  },

  async sendLowStockAlert(productName: string, currentStock: number) {
    await this.scheduleNotification(
      '⚠️ Stock Crítico!',
      `O produto "${productName}" tem apenas ${currentStock} unidades restantes. Reponha o quanto antes!`,
      { screen: 'products' }
    );
  },

  async sendInsightNotification(title: string, message: string) {
    await this.scheduleNotification(
      `💡 Smart Insight: ${title}`,
      message,
      { screen: 'dashboard' }
    );
  }
}
