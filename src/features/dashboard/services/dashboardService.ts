import { db } from '@/database/sqlite'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'

export const dashboardService = {
  getStats(): { totalProducts: number; lowStock: number; newMovementsToday: number } {
    const { user } = useAuthStore.getState()
    // Dashboard is generally visible, but let's assume if they can't even view reports, they might not see much or maybe everyone sees it.
    // For now, no strict hard block, just standard stats
    
    const totalProducts = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = 1')?.count || 0
    const lowStock = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND current_stock <= minimum_stock')?.count || 0
    
    const today = new Date().toISOString().split('T')[0]
    const newMovementsToday = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM movements WHERE created_at LIKE '${today}%'`)?.count || 0

    return { totalProducts, lowStock, newMovementsToday }
  },
  
  getTopMovedProducts(): any[] {
     return db.getAllSync<any>(`
        SELECT p.name, SUM(m.quantity) as total_qty
        FROM movements m
        JOIN products p ON m.product_id = p.id
        GROUP BY p.id
        ORDER BY total_qty DESC
        LIMIT 5
     `)
  },

  getSalesPerformance(): { revenue: number; profit: number; orderCount: number; volumeLabels: string[]; volumeData: number[] } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { revenue: 0, profit: 0, orderCount: 0, volumeLabels: [], volumeData: [] }

    // Revenue and Order Count
    const salesData = db.getFirstSync<{ revenue: number; count: number }>(
      "SELECT SUM(total_amount) as revenue, COUNT(*) as count FROM orders WHERE company_id = ? AND status = 'completed'",
      [activeCompanyId]
    ) || { revenue: 0, count: 0 }

    // Profit Calculation (Sale Price - Purchase Price) * Quantity
    // We join order_items with products to get cost
    const profitData = db.getFirstSync<{ profit: number }>(
      `SELECT SUM((oi.unit_price - p.purchase_price) * oi.quantity) as profit 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.company_id = ? AND o.status = 'completed'`,
      [activeCompanyId]
    ) || { profit: 0 }

    // Volume labels for the last 7 days (Sales Revenue per day)
    const volumeLabels: string[] = []
    const volumeData: number[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('pt-PT', { weekday: 'short' }).substring(0, 3).toUpperCase()
      
      const dayRevenue = db.getFirstSync<{ total: number }>(
        "SELECT SUM(total_amount) as total FROM orders WHERE company_id = ? AND created_at LIKE ? AND status = 'completed'",
        [activeCompanyId, `${dateStr}%`]
      )?.total || 0
      
      volumeLabels.push(label)
      volumeData.push(dayRevenue)
    }

    return { 
      revenue: salesData.revenue, 
      profit: profitData.profit, 
      orderCount: salesData.count,
      volumeLabels,
      volumeData
    }
  },

  getBestSellers(): { name: string; quantity: number; revenue: number }[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    return db.getAllSync<{ name: string; quantity: number; revenue: number }>(
      `SELECT p.name, SUM(oi.quantity) as quantity, SUM(oi.total) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.company_id = ? AND o.status = 'completed'
       GROUP BY p.id
       ORDER BY quantity DESC
       LIMIT 5`,
      [activeCompanyId]
    )
  },

  getLowStockAlerts(): { name: string; current_stock: number; minimum_stock: number }[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    return db.getAllSync<{ name: string; current_stock: number; minimum_stock: number }>(
      'SELECT name, current_stock, minimum_stock FROM products WHERE company_id = ? AND current_stock <= minimum_stock AND is_active = 1 LIMIT 10',
      [activeCompanyId]
    )
  },

  getStockHealth(): { precision: number; exato: number; faltas: number; sobras: number } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { precision: 0, exato: 0, faltas: 0, sobras: 0 }

    const stats = db.getFirstSync<{ total: number; low: number; empty: number }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN current_stock <= minimum_stock AND current_stock > 0 THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as empty
       FROM products 
       WHERE is_active = 1 AND company_id = ?`,
      [activeCompanyId]
    ) || { total: 0, low: 0, empty: 0 }

    if (stats.total === 0) return { precision: 100, exato: 0, faltas: 0, sobras: 0 }
    
    // We'll map:
    // exato -> Bom (Above minimum)
    // faltas -> Crítico (Below or equal minimum, but > 0)
    // sobras -> Esgotado (Stock 0 or less)
    
    const bom = stats.total - stats.low - stats.empty
    
    return { 
      precision: Math.round((bom / stats.total) * 100), 
      exato: bom, 
      faltas: stats.low, 
      sobras: stats.empty
    }
  }
}
