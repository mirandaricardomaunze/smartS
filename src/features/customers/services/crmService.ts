import { db } from '@/database/sqlite'
import { Customer } from '@/types'

export interface CustomerStats {
  lifetime_value: number
  orders_count: number
  avg_ticket: number
  last_purchase: string | null
  top_products: Array<{
    name: string
    quantity: number
  }>
}

export const crmService = {
  /**
   * Get intelligence stats for a specific customer
   */
  getCustomerStats(customerId: string): CustomerStats {
    // 1. Basic totals
    const basicQuery = `
      SELECT 
        SUM(total_amount) as lifetime_value,
        COUNT(id) as orders_count,
        MAX(created_at) as last_purchase
      FROM orders
      WHERE customer_id = ? AND status = 'completed'
    `
    const basicStats = db.getFirstSync<any>(basicQuery, [customerId])

    // 2. Top products
    const productsQuery = `
      SELECT 
        p.name,
        SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.customer_id = ? AND o.status = 'completed'
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 3
    `
    const topProducts = db.getAllSync<any>(productsQuery, [customerId])

    const lv = basicStats?.lifetime_value || 0
    const count = basicStats?.orders_count || 0

    return {
      lifetime_value: lv,
      orders_count: count,
      avg_ticket: count > 0 ? lv / count : 0,
      last_purchase: basicStats?.last_purchase || null,
      top_products: topProducts.map(p => ({
        name: p.name,
        quantity: p.total_quantity
      }))
    }
  }
}
