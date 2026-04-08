import { db } from '@/database/sqlite'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'

export const dashboardService = {
  getStats(): { totalProducts: number; lowStock: number; newMovementsToday: number; inventoryValue: number; totalEntries: number; totalExits: number } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { totalProducts: 0, lowStock: 0, newMovementsToday: 0, inventoryValue: 0, totalEntries: 0, totalExits: 0 }
    
    const totalProducts = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE company_id = ? AND is_active = 1', [activeCompanyId])?.count || 0
    const lowStock = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE company_id = ? AND is_active = 1 AND current_stock <= minimum_stock', [activeCompanyId])?.count || 0
    
    const today = new Date().toISOString().split('T')[0]
    const newMovementsToday = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM stock_movements WHERE company_id = ? AND created_at LIKE '${today}%'`, [activeCompanyId])?.count || 0

    const inventoryValue = db.getFirstSync<{ total: number }>(
      'SELECT SUM(current_stock * purchase_price) as total FROM products WHERE company_id = ? AND is_active = 1',
      [activeCompanyId]
    )?.total || 0

    const moveStats = db.getFirstSync<{ entries: number; exits: number }>(
      `SELECT 
        SUM(CASE WHEN type = 'entry' THEN quantity ELSE 0 END) as entries,
        SUM(CASE WHEN type IN ('exit', 'sale') THEN quantity ELSE 0 END) as exits
       FROM stock_movements WHERE company_id = ?`,
      [activeCompanyId]
    ) || { entries: 0, exits: 0 }

    return { 
      totalProducts, 
      lowStock, 
      newMovementsToday, 
      inventoryValue,
      totalEntries: moveStats.entries,
      totalExits: moveStats.exits
    }
  },

  getTodaySummary(): { revenue: number; profit: number; orderCount: number } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { revenue: 0, profit: 0, orderCount: 0 }

    const today = new Date().toISOString().split('T')[0]
    
    const sales = db.getFirstSync<{ revenue: number; count: number }>(
      "SELECT SUM(total_amount) as revenue, COUNT(*) as count FROM orders WHERE company_id = ? AND status = 'completed' AND created_at LIKE ?",
      [activeCompanyId, `${today}%`]
    ) || { revenue: 0, count: 0 }

    const profit = db.getFirstSync<{ profit: number }>(
      `SELECT SUM((oi.unit_price - p.purchase_price) * oi.quantity) as profit
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.company_id = ? AND o.status = 'completed' AND o.created_at LIKE ?`,
      [activeCompanyId, `${today}%`]
    )?.profit || 0

    return { 
      revenue: sales.revenue || 0, 
      profit: profit || 0, 
      orderCount: sales.count || 0 
    }
  },
  
  getTopMovedProducts(): any[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return db.getAllSync<any>(`
       SELECT p.name, SUM(m.quantity) as total_qty
       FROM stock_movements m
       JOIN products p ON m.product_id = p.id
       WHERE m.company_id = ?
       GROUP BY p.id
       ORDER BY total_qty DESC
       LIMIT 20
    `, [activeCompanyId])
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
       LIMIT 20`,
      [activeCompanyId]
    )
  },

  getLowStockAlerts(): { id: string; name: string; current_stock: number; minimum_stock: number }[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    return db.getAllSync<{ id: string; name: string; current_stock: number; minimum_stock: number }>(
      'SELECT id, name, current_stock, minimum_stock FROM products WHERE company_id = ? AND current_stock <= minimum_stock AND is_active = 1 LIMIT 100',
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
  },
  
  getCategorySales(): { labels: string[]; data: number[] } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { labels: [], data: [] }

    const data = db.getAllSync<{ name: string; total: number }>(
      `SELECT c.name, SUM(oi.total) as total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.company_id = ? AND o.status = 'completed' AND o.created_at >= date('now', '-30 days')
       GROUP BY c.id
       ORDER BY total DESC
       LIMIT 20`,
      [activeCompanyId]
    )

    return {
      labels: data.map(i => i.name.substring(0, 10).toUpperCase()),
      data: data.map(i => i.total)
    }
  },

  getFinancialTrends(): { labels: string[]; revenue: number[]; expenses: number[] } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { labels: [], revenue: [], expenses: [] }

    const labels: string[] = []
    const revenue: number[] = []
    const expenses: number[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthStr = d.toISOString().substring(0, 7) // YYYY-MM
      const label = d.toLocaleDateString('pt-PT', { month: 'short' }).toUpperCase()

      const rev = db.getFirstSync<{ total: number }>(
        "SELECT SUM(total_amount) as total FROM orders WHERE company_id = ? AND status = 'completed' AND created_at LIKE ?",
        [activeCompanyId, `${monthStr}%`]
      )?.total || 0

      const exp = db.getFirstSync<{ total: number }>(
        "SELECT SUM(amount) as total FROM financial_transactions WHERE company_id = ? AND status = 'paid' AND date LIKE ?",
        [activeCompanyId, `${monthStr}%`]
      )?.total || 0

      labels.push(label)
      revenue.push(rev)
      expenses.push(exp)
    }

    return { labels, revenue, expenses }
  },

  getInventoryValueData(): { labels: string[]; data: number[] } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { labels: [], data: [] }

    const data = db.getAllSync<{ name: string; value: number }>(
      `SELECT c.name, SUM(p.current_stock * p.purchase_price) as value
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.company_id = ? AND p.is_active = 1
       GROUP BY c.id
       ORDER BY value DESC
       LIMIT 20`,
      [activeCompanyId]
    )

    return {
      labels: data.map(i => i.name.substring(0, 10).toUpperCase()),
      data: data.map(i => i.value)
    }
  },

  getAttendanceSummary(): { labels: string[]; data: number[] } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { labels: [], data: [] }

    const labels: string[] = []
    const data: number[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('pt-PT', { weekday: 'short' }).substring(0, 3).toUpperCase()

      const stats = db.getFirstSync<{ present: number; total: number }>(
        `SELECT 
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
          COUNT(*) as total
         FROM attendance 
         WHERE company_id = ? AND date = ?`,
        [activeCompanyId, dateStr]
      ) || { present: 0, total: 0 }

      const rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0
      labels.push(label)
      data.push(rate)
    }

    return { labels, data }
  },

  getCategoryMargins(): { labels: string[]; data: number[] } {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return { labels: [], data: [] }

    const data = db.getAllSync<{ name: string; margin: number }>(
      `SELECT 
        c.name,
        AVG((oi.unit_price - p.purchase_price) / oi.unit_price * 100) as margin
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.company_id = ? AND o.status = 'completed' AND p.purchase_price > 0
       GROUP BY c.id
       ORDER BY margin DESC
       LIMIT 20`,
      [activeCompanyId]
    )

    return {
      labels: data.map(i => i.name.substring(0, 10).toUpperCase()),
      data: data.map(i => Math.round(i.margin))
    }
  }
}
