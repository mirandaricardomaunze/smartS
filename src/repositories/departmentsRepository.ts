import { db } from '@/database/sqlite'
import { Department } from '../features/hr/types'
import { uuid } from '@/utils/uuid'

export const departmentsRepository = {
  getAll(companyId: string): Department[] {
    return db.getAllSync('SELECT * FROM departments WHERE company_id = ? AND is_active = 1 ORDER BY name ASC', [companyId]) as Department[]
  },

  getById(companyId: string, id: string): Department | null {
    return db.getFirstSync('SELECT * FROM departments WHERE company_id = ? AND id = ?', [companyId, id]) as Department || null
  },

  create(data: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'synced'>): Department {
    const id = uuid()
    const now = new Date().toISOString()
    
    db.runSync(`
      INSERT INTO departments (id, company_id, name, description, is_active, created_at, updated_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [id, data.company_id, data.name, data.description, data.is_active, now, now])

    return {
      id,
      ...data,
      created_at: now,
      updated_at: now,
      synced: 0
    }
  },

  update(companyId: string, id: string, data: Partial<Department>): void {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'synced')
    const sets = keys.map(key => `${key} = ?`).join(', ')
    const values = keys.map(key => (data as any)[key])
    const now = new Date().toISOString()

    db.runSync(`
      UPDATE departments 
      SET ${sets}, updated_at = ?, synced = 0 
      WHERE company_id = ? AND id = ?
    `, [...values, now, companyId, id])
  },

  delete(companyId: string, id: string): void {
    // Soft delete
    db.runSync('UPDATE departments SET is_active = 0, synced = 0 WHERE company_id = ? AND id = ?', [companyId, id])
  }
}
