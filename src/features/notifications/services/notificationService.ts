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

  async checkLowStockAlerts(companyId: string): Promise<void> {
    const lowStockProducts = db.getAllSync<any>(
      'SELECT name, current_stock, minimum_stock, unit FROM products WHERE company_id = ? AND is_active = 1 AND current_stock <= minimum_stock',
      [companyId]
    )
    
    for (const product of lowStockProducts) {
      await this.notifyIfLowStock(companyId, product)
    }
  },

  async checkLowStockForProduct(companyId: string, productId: string): Promise<void> {
    const product = db.getFirstSync<any>(
      'SELECT name, current_stock, minimum_stock, unit FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    )

    if (product && product.current_stock <= product.minimum_stock) {
      await this.notifyIfLowStock(companyId, product)
    }
  },

  async notifyIfLowStock(companyId: string, product: any): Promise<void> {
    const title = 'Alerta de Stock Crítico'
    const message = `"${product.name}" tem apenas ${product.current_stock} ${product.unit || 'un'} em stock. Reponha já!`
    
    // Check for unread notification for THIS product today
    const existing = db.getFirstSync<any>(
      'SELECT id FROM notifications WHERE title = ? AND message LIKE ? AND is_read = 0 AND date(created_at) = date("now")',
      [title, `"${product.name}"%`]
    )

    if (!existing) {
      await this.create({
        company_id: companyId,
        title,
        message,
        type: 'warning'
      })

      // Immediate Push Notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ ${title}`,
          body: message,
          data: { screen: 'inventory' },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
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
  },

  async checkTrialNotifications(trialStartedAt: string, companyId: string): Promise<void> {
    const start = new Date(trialStartedAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const milestones = [
      { day: 7, title: '7 dias com SmartS!', body: 'Já usas o app há 7 dias! Vê o que o plano Pro oferece.' },
      { day: 20, title: 'Trial em curso', body: 'Faltam 10 dias do teu trial. Escolhe o teu plano.' },
      { day: 27, title: 'Trial quase a terminar', body: 'O teu trial termina em 3 dias. Não percas os teus dados!' },
      { day: 28, title: 'Trial quase a terminar', body: 'O teu trial termina em 2 dias. Não percas os teus dados!' },
      { day: 30, title: 'Trial Expirado', body: 'O teu trial expirou. Subscreve para continuar.' },
    ]

    for (const m of milestones) {
      if (diffDays === m.day) {
        const existing = db.getFirstSync<any>(
          'SELECT id FROM notifications WHERE title = ? AND company_id = ? AND date(created_at) = date("now")',
          [m.title, companyId]
        )

        if (!existing) {
          await this.create({
            company_id: companyId,
            title: m.title,
            message: m.body,
            type: m.day === 30 ? 'warning' : 'info'
          })

          await this.scheduleNotification(`🎁 ${m.title}`, m.body, { screen: 'choose-plan' })
        }
      }
    }
  }
}
