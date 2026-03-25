import { db } from '../database/sqlite'
import { Supplier } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const supplierRepository = {
  getAll: (companyId: string): Supplier[] => {
    return db.getAllSync<Supplier>(
      'SELECT * FROM suppliers WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    )
  },

  getById: (id: string): Supplier | null => {
    return db.getFirstSync<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id])
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

  update: (id: string, data: Partial<Supplier>): void => {
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at')
    if (fields.length === 0) return

    const query = `UPDATE suppliers SET ${fields.map(f => `${f} = ?`).join(', ')}, synced = 0 WHERE id = ?`
    const values = [...fields.map(f => (data as any)[f]), id]

    db.runSync(query, values)
    
    const updated = db.getFirstSync<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id])
    if (updated) {
      syncRepository.addToQueue('suppliers', 'UPDATE', updated)
    }
  },

  delete: (id: string): void => {
    db.runSync('DELETE FROM suppliers WHERE id = ?', [id])
    syncRepository.addToQueue('suppliers', 'DELETE', { id })
  }
}
