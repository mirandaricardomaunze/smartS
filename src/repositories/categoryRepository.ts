import { db } from '../database/sqlite'
import { Category } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { syncRepository } from './syncRepository'

export const categoryRepository = {
  getAll: (companyId: string): Category[] => {
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    )
  },

  getById: (companyId: string, id: string): Category | null => {
    return db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ? AND company_id = ?', [id, companyId])
  },

  create: (data: Omit<Category, 'id' | 'created_at' | 'synced'>): Category => {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    db.runSync(
      `INSERT INTO categories (id, company_id, name, description, created_at, synced) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, data.company_id, data.name, data.description, now]
    )

    const category = { ...data, id, created_at: now, synced: 0 as const }
    syncRepository.addToQueue('categories', 'INSERT', category)
    
    return category
  },

  update: (companyId: string, id: string, data: Partial<Category>): void => {
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at' && key !== 'company_id')
    if (fields.length === 0) return

    const query = `UPDATE categories SET ${fields.map(f => `${f} = ?`).join(', ')}, synced = 0 WHERE id = ? AND company_id = ?`
    const values = [...fields.map(f => (data as any)[f]), id, companyId]

    db.runSync(query, values)
    
    const updated = db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ? AND company_id = ?', [id, companyId])
    if (updated) {
      syncRepository.addToQueue('categories', 'UPDATE', updated)
    }
  },

  delete: (companyId: string, id: string): void => {
    db.runSync('DELETE FROM categories WHERE id = ? AND company_id = ?', [id, companyId])
    syncRepository.addToQueue('categories', 'DELETE', { id, company_id: companyId })
  }
}
