import { db } from '../database/sqlite'
import { Customer } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const customerRepository = {
  getAll: (companyId: string, limit: number = 20, offset: number = 0): Customer[] => {
    return db.getAllSync<Customer>(
      `SELECT c.*,
       (SELECT SUM(total_amount - discount) FROM orders o
        WHERE o.customer_id = c.id AND o.status NOT IN ('paid', 'completed', 'cancelled')) as total_debt
       FROM customers c
       WHERE c.company_id = ?
       ORDER BY name ASC
       LIMIT ? OFFSET ?`,
      [companyId, Math.min(limit, 500), offset]
    )
  },

  getById: (companyId: string, id: string): (Customer & { order_count: number }) | null => {
    return db.getFirstSync<Customer & { order_count: number }>(
      `SELECT c.*, 
       (SELECT SUM(total_amount - discount) FROM orders o 
        WHERE o.customer_id = c.id AND o.status NOT IN ('paid', 'completed', 'cancelled')) as total_debt,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) as order_count
       FROM customers c 
       WHERE c.id = ? AND c.company_id = ?`, 
      [id, companyId]
    )
  },

  create: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'synced'>): Customer => {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    db.runSync(
      `INSERT INTO customers (id, company_id, name, email, phone, address, nif, created_at, updated_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, data.company_id, data.name, data.email, data.phone, data.address, data.nif, now, now]
    )

    const customer = { ...data, id, created_at: now, updated_at: now, synced: 0 as const }
    syncRepository.addToQueue('customers', 'INSERT', customer)
    
    return customer
  },

  update: (companyId: string, id: string, data: Partial<Customer>): void => {
    const now = new Date().toISOString()
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'company_id')
    if (fields.length === 0) return

    const query = `UPDATE customers SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = ?, synced = 0 WHERE id = ? AND company_id = ?`
    const values = [...fields.map(f => (data as any)[f]), now, id, companyId]

    db.runSync(query, values)
    
    const updated = db.getFirstSync<Customer>('SELECT * FROM customers WHERE id = ? AND company_id = ?', [id, companyId])
    if (updated) {
      syncRepository.addToQueue('customers', 'UPDATE', updated)
    }
  },

  delete: (companyId: string, id: string): void => {
    db.runSync('DELETE FROM customers WHERE id = ? AND company_id = ?', [id, companyId])
    syncRepository.addToQueue('customers', 'DELETE', { id, company_id: companyId })
  }
}
