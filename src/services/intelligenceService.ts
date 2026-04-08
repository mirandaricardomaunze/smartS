import { db } from '@/database/sqlite'
import { useCompanyStore } from '@/store/companyStore'
import { Product } from '@/types'

export interface ABCAnalysis {
  id: string
  name: string
  total_sold_value: number
  percentage: number
  classification: 'A' | 'B' | 'C'
}

export interface StockForecast {
  id: string
  name: string
  current_stock: number
  avg_daily_sales: number
  days_remaining: number
  risk_level: 'critical' | 'warning' | 'stable'
}

export interface ProfitabilityAnalysis {
  id: string
  name: string
  total_sold: number
  unit_profit: number
  total_profit: number
  margin_percentage: number
}

export interface CriticalStockItem {
  name: string
  current_stock: number
  minimum_stock: number
}

export const intelligenceService = {
  /**
   * Performs ABC Analysis based on total sales value in the last 30 days
   */
  getABCAnalysis(): ABCAnalysis[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    const query = `
      SELECT 
        p.id, 
        p.name, 
        SUM(oi.quantity * oi.unit_price) as total_sold_value
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.company_id = ? 
        AND o.status = 'completed'
        AND o.created_at >= date('now', '-30 days')
      GROUP BY p.id
      ORDER BY total_sold_value DESC
    `

    const rawData = db.getAllSync<any>(query, [activeCompanyId])
    const totalRevenue = rawData.reduce((acc, curr) => acc + curr.total_sold_value, 0)

    let cumulativePercentage = 0
    return rawData.map(item => {
      const percentage = totalRevenue > 0 ? (item.total_sold_value / totalRevenue) * 100 : 0
      cumulativePercentage += percentage

      let classification: 'A' | 'B' | 'C' = 'C'
      if (cumulativePercentage <= 70) classification = 'A'
      else if (cumulativePercentage <= 90) classification = 'B'

      return {
        id: item.id,
        name: item.name,
        total_sold_value: item.total_sold_value,
        percentage,
        classification
      }
    })
  },

  /**
   * Forecasts how many days of stock are remaining based on sales from the last 15 days
   */
  getStockForecast(): StockForecast[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.current_stock,
        SUM(oi.quantity) as total_sold_quantity
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE p.company_id = ? 
        AND p.is_active = 1
        AND (o.id IS NULL OR (o.status = 'completed' AND o.created_at >= date('now', '-15 days')))
      GROUP BY p.id
    `

    const rawData = db.getAllSync<any>(query, [activeCompanyId])

    return rawData.map(item => {
      const avgDailySales = item.total_sold_quantity / 15
      const daysRemaining = avgDailySales > 0 ? item.current_stock / avgDailySales : 999
      
      let risk_level: 'critical' | 'warning' | 'stable' = 'stable'
      if (daysRemaining <= 3) risk_level = 'critical'
      else if (daysRemaining <= 7) risk_level = 'warning'

      return {
        id: item.id,
        name: item.name,
        current_stock: item.current_stock,
        avg_daily_sales: avgDailySales,
        days_remaining: daysRemaining === 999 ? 999 : Math.round(daysRemaining),
        risk_level
      }
    }).filter(f => f.days_remaining <= 30) // Only show relevant risks
      .sort((a, b) => a.days_remaining - b.days_remaining)
  },

  /**
   * Identifies products with the highest net profit in the last 30 days
   */
  getProfitabilityAnalysis(): ProfitabilityAnalysis[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.purchase_price,
        p.sale_price,
        SUM(oi.quantity) as total_sold
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.company_id = ? 
        AND o.status = 'completed'
        AND o.created_at >= date('now', '-30 days')
      GROUP BY p.id
      ORDER BY (p.sale_price - p.purchase_price) * SUM(oi.quantity) DESC
      LIMIT 10
    `

    const rawData = db.getAllSync<any>(query, [activeCompanyId])

    return rawData.map(item => {
      const unitProfit = (item.sale_price || 0) - (item.purchase_price || 0)
      const totalProfit = unitProfit * item.total_sold
      const marginPercentage = item.sale_price > 0 ? (unitProfit / item.sale_price) * 100 : 0

      return {
        id: item.id,
        name: item.name,
        total_sold: item.total_sold,
        unit_profit: unitProfit,
        total_profit: totalProfit,
        margin_percentage: marginPercentage
      }
    })
  },

  /**
   * Returns items that are strictly below their minimum_stock
   */
  getCriticalStockItems(): CriticalStockItem[] {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []

    return db.getAllSync<CriticalStockItem>(
      `SELECT name, current_stock, minimum_stock 
       FROM products 
       WHERE company_id = ? 
         AND is_active = 1 
         AND current_stock <= minimum_stock 
         AND current_stock > 0`, 
      [activeCompanyId]
    )
  }
}
