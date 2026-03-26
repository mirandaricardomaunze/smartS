import { db } from '../database/sqlite'
import { Supplier } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const supplierRepository = {
  getAll: (companyId: string): Supplier[] => {
    return db.getAllSync<Supplier>(
      `SELECT s.*, 
       (SELECT COUNT(*) FROM products p 
        WHERE p.supplier_id = s.id AND p.is_active = 1 AND p.current_stock <= p.minimum_stock) as low_stock_count
       FROM suppliers s 
       WHERE s.company_id = ? 
       ORDER BY name ASC`,
      [companyId]
    )
  },

  getById: (companyId: string, id: string): Supplier | null => {
    return db.getFirstSync<Supplier>('SELECT * FROM suppliers WHERE id = ? AND company_id = ?', [id, companyId])
  },

  create: (data: Omit<Supplier, 'id' | 'created_at' | 'synced'>): Supplier => {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    db.runSync(
      `INSERT INTO suppliers (id, company_id, name, contact_name, email, phone, address, nif, created_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, data.company_id, data.name, data.contact_name, data.email, data.phone, data.address, data.nif, now]
    )

    const supplier = { ...data, id, created_at: now, synced: 0 as const }
    syncRepository.addToQueue('suppliers', 'INSERT', supplier)
    
    return supplier
  },

  update: (companyId: string, id: string, data: Partial<Supplier>): void => {
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at' && key !== 'company_id')
    if (fields.length === 0) return

    const query = `UPDATE suppliers SET ${fields.map(f => `${f} = ?`).join(', ')}, synced = 0 WHERE id = ? AND company_id = ?`
    const values = [...fields.map(f => (data as any)[f]), id, companyId]

    db.runSync(query, values)
    
    const updated = db.getFirstSync<Supplier>('SELECT * FROM suppliers WHERE id = ? AND company_id = ?', [id, companyId])
    if (updated) {
      syncRepository.addToQueue('suppliers', 'UPDATE', updated)
    }
  },

  delete: (companyId: string, id: string): void => {
    db.runSync('DELETE FROM suppliers WHERE id = ? AND company_id = ?', [id, companyId])
    syncRepository.addToQueue('suppliers', 'DELETE', { id, company_id: companyId })
  }
}
