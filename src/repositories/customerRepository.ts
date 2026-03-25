import { db } from '../database/sqlite'
import { Customer } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const customerRepository = {
  getAll: (companyId: string): Customer[] => {
    return db.getAllSync<Customer>(
      'SELECT * FROM customers WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    )
  },

  getById: (id: string): Customer | null => {
    return db.getFirstSync<Customer>('SELECT * FROM customers WHERE id = ?', [id])
  },

  create: (data: Omit<Customer, 'id' | 'created_at' | 'synced'>): Customer => {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    db.runSync(
      `INSERT INTO customers (id, company_id, name, email, phone, address, nif, created_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, data.company_id, data.name, data.email, data.phone, data.address, data.nif, now]
    )

    const customer = { ...data, id, created_at: now, synced: 0 as const }
    syncRepository.addToQueue('customers', 'INSERT', customer)
    
    return customer
  },

  update: (id: string, data: Partial<Customer>): void => {
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at')
    if (fields.length === 0) return

    const query = `UPDATE customers SET ${fields.map(f => `${f} = ?`).join(', ')}, synced = 0 WHERE id = ?`
    const values = [...fields.map(f => (data as any)[f]), id]

    db.runSync(query, values)
    
    const updated = db.getFirstSync<Customer>('SELECT * FROM customers WHERE id = ?', [id])
    if (updated) {
      syncRepository.addToQueue('customers', 'UPDATE', updated)
    }
  },

  delete: (id: string): void => {
    db.runSync('DELETE FROM customers WHERE id = ?', [id])
    syncRepository.addToQueue('customers', 'DELETE', { id })
  }
}
