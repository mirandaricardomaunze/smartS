import { db } from '@/database/sqlite'

export interface InventoryReportData {
  total_products: number
  total_stock: number
  low_stock_count: number
  active_categories: string[]
  items: Array<{
    name: string
    sku: string
    reference: string
    category: string
    current_stock: number
    minimum_stock: number
  }>
}

export interface MovementReportData {
  total_entries: number
  total_exits: number
  net_movement: number
  top_moved_products: Array<{
    name: string
    total_qty: number
  }>
  movements_by_day: Array<{
    date: string
    count: number
  }>
}

export const reportRepository = {
  getInventoryData(companyId: string): InventoryReportData {
    const items = db.getAllSync<any>(
      `SELECT p.name, p.sku, p.reference, c.name as category, p.current_stock, p.minimum_stock 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.company_id = ? AND p.is_active = 1 
       ORDER BY p.name ASC`,
      [companyId]
    )

    const categories = db.getAllSync<{ category: string }>(
      'SELECT DISTINCT name as category FROM categories WHERE company_id = ?',
      [companyId]
    )

    const stats = db.getFirstSync<any>(
      'SELECT COUNT(*) as total_products, SUM(current_stock) as total_stock, SUM(CASE WHEN current_stock <= minimum_stock THEN 1 ELSE 0 END) as low_stock_count FROM products WHERE is_active = 1 AND company_id = ?',
      [companyId]
    )

    return {
      total_products: stats?.total_products || 0,
      total_stock: stats?.total_stock || 0,
      low_stock_count: stats?.low_stock_count || 0,
      active_categories: categories.map(c => c.category),
      items
    }
  },

  getMovementsData(companyId: string, days: number = 30): MovementReportData {
    const stats = db.getFirstSync<any>(
      `SELECT 
        SUM(CASE WHEN type = 'entry' THEN quantity ELSE 0 END) as total_entries,
        SUM(CASE WHEN type = 'exit' THEN quantity ELSE 0 END) as total_exits
       FROM movements 
       WHERE company_id = ? AND created_at >= date('now', '-' || ? || ' days')`,
      [companyId, days]
    )

    const topMoved = db.getAllSync<any>(
      `SELECT p.name, SUM(m.quantity) as total_qty
       FROM movements m
       JOIN products p ON m.product_id = p.id
       WHERE m.company_id = ? AND m.created_at >= date('now', '-' || ? || ' days')
       GROUP BY m.product_id
       ORDER BY total_qty DESC
       LIMIT 5`,
      [companyId, days]
    )

    const byDay = db.getAllSync<any>(
      `SELECT date(created_at) as date, COUNT(*) as count
       FROM movements
       WHERE company_id = ? AND created_at >= date('now', '-' || ? || ' days')
       GROUP BY date(created_at)
       ORDER BY date ASC`,
      [companyId, days]
    )

    return {
      total_entries: stats?.total_entries || 0,
      total_exits: stats?.total_exits || 0,
      net_movement: (stats?.total_entries || 0) - (stats?.total_exits || 0),
      top_moved_products: topMoved,
      movements_by_day: byDay
    }
  },

  getExpiryData(companyId: string): any[] {
    return db.getAllSync<any>(
      `SELECT p.name, p.reference, e.lot_number, e.expiry_date, e.quantity
       FROM expiry_lots e
       JOIN products p ON e.product_id = p.id
       WHERE e.company_id = ? AND e.expiry_date <= date('now', '+90 days')
       ORDER BY e.expiry_date ASC`,
      [companyId]
    )
  },

  getFinancialData(companyId: string): { total_purchase_value: number, total_sale_value: number, potential_profit: number } {
    const stats = db.getFirstSync<any>(
      `SELECT 
        SUM(current_stock * purchase_price) as total_purchase_value,
        SUM(current_stock * sale_price) as total_sale_value
       FROM products 
       WHERE is_active = 1 AND company_id = ?`,
      [companyId]
    )
    
    const total_purchase_value = stats?.total_purchase_value || 0
    const total_sale_value = stats?.total_sale_value || 0

    return {
      total_purchase_value,
      total_sale_value,
      potential_profit: total_sale_value - total_purchase_value
    }
  },

  getSalesData(companyId: string, days: number = 30): any[] {
    return db.getAllSync<any>(
      `SELECT o.number, o.customer_name, o.total_amount, o.status, o.created_at
       FROM orders o
       WHERE o.company_id = ? AND o.created_at >= date('now', '-' || ? || ' days')
       ORDER BY o.created_at DESC`,
      [companyId, days]
    )
  },

  getPnLData(companyId: string, days: number = 30): { revenue: number, cost: number, expenses: number, profit: number } {
    const revenue = db.getFirstSync<{ total: number }>(
      "SELECT SUM(total_amount) as total FROM orders WHERE company_id = ? AND status = 'completed' AND created_at >= date('now', '-' || ? || ' days')",
      [companyId, days]
    )?.total || 0

    const cost = db.getFirstSync<{ total: number }>(
      `SELECT SUM(oi.quantity * p.purchase_price) as total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.company_id = ? AND o.status = 'completed' AND o.created_at >= date('now', '-' || ? || ' days')`,
      [companyId, days]
    )?.total || 0

    const expenses = db.getFirstSync<{ total: number }>(
      "SELECT SUM(amount) as total FROM financial_transactions WHERE company_id = ? AND type = 'expense' AND date >= date('now', '-' || ? || ' days')",
      [companyId, days]
    )?.total || 0

    return {
      revenue,
      cost,
      expenses,
      profit: revenue - cost - expenses
    }
  }
}
