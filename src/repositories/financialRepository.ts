import { db } from '../database/sqlite'
import { FinancialTransaction } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const financialRepository = {
  getAll: (companyId: string): FinancialTransaction[] => {
    return db.getAllSync<FinancialTransaction>(
      'SELECT * FROM financial_transactions WHERE company_id = ? ORDER BY date DESC',
      [companyId]
    )
  },

  create: (data: Omit<FinancialTransaction, 'id' | 'created_at' | 'synced'>): FinancialTransaction => {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    db.runSync(
      `INSERT INTO financial_transactions (id, company_id, type, category, amount, description, date, status, related_type, related_id, created_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, data.company_id, data.type, data.category, data.amount, data.description, data.date, data.status, data.related_type, data.related_id, now]
    )

    const transaction = { ...data, id, created_at: now, synced: 0 as const }
    syncRepository.addToQueue('financial_transactions', 'INSERT', transaction)
    
    return transaction
  },

  getStats: (companyId: string, startDate: string, endDate: string) => {
    const stats = db.getAllSync<{ type: string, total: number }>(
      `SELECT type, SUM(amount) as total 
       FROM financial_transactions 
       WHERE company_id = ? AND date BETWEEN ? AND ? AND status = 'paid'
       GROUP BY type`,
      [companyId, startDate, endDate]
    )
    
    return {
      income: stats.find(s => s.type === 'income')?.total || 0,
      expense: stats.find(s => s.type === 'expense')?.total || 0
    }
  }
}
