import { useState, useCallback } from 'react'
import { financialRepository } from '@/repositories/financialRepository'
import { financialService } from '@/services/financialService'
import { FinancialTransaction } from '@/types'
import { useCompanyStore } from '@/store/companyStore'

export function useFinance() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [stats, setStats] = useState({ income: 0, expense: 0, profit: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)

  const fetchFinance = useCallback(async () => {
    if (!activeCompanyId) return
    setIsLoading(true)
    try {
      const data = financialRepository.getAll(activeCompanyId)
      setTransactions(data)
      
      const kpis = financialService.getProfessionalKPIs(activeCompanyId)
      setStats({
        income: kpis.monthlyRevenue,
        expense: kpis.monthlyExpenses,
        profit: kpis.netProfit
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId])

  const createTransaction = async (data: Omit<FinancialTransaction, 'id' | 'created_at' | 'synced'>) => {
    const finalData = { ...data }
    if (!finalData.company_id && activeCompanyId) {
      finalData.company_id = activeCompanyId
    }
    const tx = financialRepository.create(finalData)
    fetchFinance()
    return tx
  }

  return {
    transactions,
    stats,
    isLoading,
    fetchFinance,
    createTransaction
  }
}
