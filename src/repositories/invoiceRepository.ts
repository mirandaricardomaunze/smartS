import { db } from '../database/sqlite'
import { Invoice } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const invoiceRepository = {
  getAll: (companyId: string): Invoice[] => {
    return db.getAllSync<Invoice>(
      'SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    )
  },

  getByOrderId: (orderId: string): Invoice | null => {
    return db.getFirstSync<Invoice>('SELECT * FROM invoices WHERE order_id = ?', [orderId])
  },

  create: (data: Omit<Invoice, 'id' | 'created_at' | 'synced'>): Invoice => {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    db.runSync(
      `INSERT INTO invoices (id, company_id, order_id, customer_id, number, type, status, total_amount, due_date, created_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, data.company_id, data.order_id, data.customer_id, data.number, data.type, data.status, data.total_amount, data.due_date, now]
    )

    const invoice = { ...data, id, created_at: now, synced: 0 as const }
    syncRepository.addToQueue('invoices', 'INSERT', invoice)
    
    return invoice
  },

  updateStatus: (id: string, status: Invoice['status']): void => {
    db.runSync('UPDATE invoices SET status = ?, synced = 0 WHERE id = ?', [status, id])
    
    const updated = db.getFirstSync<Invoice>('SELECT * FROM invoices WHERE id = ?', [id])
    if (updated) {
      syncRepository.addToQueue('invoices', 'UPDATE', updated)
    }
  }
}
