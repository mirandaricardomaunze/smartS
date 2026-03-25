import { useState, useCallback, useEffect } from 'react'
import { dashboardService } from '../services/dashboardService'

export function useDashboard() {
  const [stats, setStats] = useState<{ totalProducts: number; lowStock: number; newMovementsToday: number }>({
    totalProducts: 0, lowStock: 0, newMovementsToday: 0
  })
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [weeklyMovements, setWeeklyMovements] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })
  const [stockHealth, setStockHealth] = useState<{ precision: number; exato: number; faltas: number; sobras: number }>({
    precision: 100, exato: 100, faltas: 0, sobras: 0
  })
  const [salesPerformance, setSalesPerformance] = useState<{ revenue: number; profit: number; orderCount: number; volumeLabels: string[]; volumeData: number[] }>({
    revenue: 0, profit: 0, orderCount: 0, volumeLabels: [], volumeData: []
  })
  const [bestSellers, setBestSellers] = useState<{ name: string; quantity: number; revenue: number }[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<{ name: string; current_stock: number; minimum_stock: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setStats(dashboardService.getStats())
      setTopProducts(dashboardService.getTopMovedProducts())
      setStockHealth(dashboardService.getStockHealth())
      setSalesPerformance(dashboardService.getSalesPerformance())
      setBestSellers(dashboardService.getBestSellers())
      setLowStockAlerts(dashboardService.getLowStockAlerts())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { stats, topProducts, stockHealth, salesPerformance, bestSellers, lowStockAlerts, isLoading, reload: load }
}
