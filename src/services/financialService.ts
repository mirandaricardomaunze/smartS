import { financialRepository } from '@/repositories/financialRepository'
import { orderRepository } from '@/repositories/orderRepository'
import { invoiceRepository } from '@/repositories/invoiceRepository'
import { FinancialTransaction, Company } from '@/types'

export const financialService = {
  /**
   * Registers a payment for an invoice or order
   */
  recordPayment: async (
    company_id: string,
    invoiceId: string,
    amount: number,
    method: string = 'Cash'
  ) => {
    // 1. Record the financial transaction
    const transaction = await financialRepository.create({
      company_id,
      type: 'income',
      category: 'Vendas',
      amount,
      description: `Pagamento de fatura #${invoiceId}`,
      date: new Date().toISOString(),
      status: 'paid',
      related_type: 'invoice',
      related_id: invoiceId
    })

    // 2. Update invoice status to 'paid'
    await invoiceRepository.updateStatus(company_id, invoiceId, 'paid')

    return transaction
  },

  /**
   * Gets professional dashboard KPIs
   */
  getProfessionalKPIs: (companyId: string) => {
    const now = new Date()
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const stats = financialRepository.getStats(companyId, firstDayMonth, lastDayMonth)
    
    const orders = orderRepository.getAll(companyId)
    const monthlyOrders = orders.filter(o => o.created_at >= firstDayMonth)
    
    const pendingInvoices = invoiceRepository.getAll(companyId).filter(i => i.status === 'issued')
    const totalPending = pendingInvoices.reduce((acc, inv) => acc + inv.total_amount, 0)

    return {
      monthlyRevenue: stats.income,
      monthlyExpenses: stats.expense,
      netProfit: stats.income - stats.expense,
      ordersCount: monthlyOrders.length,
      pendingCollection: totalPending,
      topPerformance: 0.85 // Placeholder for growth percentage
    }
  }
}
