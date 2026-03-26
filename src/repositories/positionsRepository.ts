import { db } from '@/database/sqlite'
import { Position } from '../features/hr/types'
import { uuid } from '@/utils/uuid'

export const positionsRepository = {
  getAll(companyId: string): Position[] {
    return db.getAllSync(`
      SELECT p.*, d.name as department 
      FROM positions p
      JOIN departments d ON p.department_id = d.id
      WHERE p.company_id = ? AND p.is_active = 1 
      ORDER BY p.title ASC
    `, [companyId]) as Position[]
  },

  getByDepartment(companyId: string, departmentId: string): Position[] {
    return db.getAllSync('SELECT * FROM positions WHERE company_id = ? AND department_id = ? AND is_active = 1', [companyId, departmentId]) as Position[]
  },

  getById(companyId: string, id: string): Position | null {
    return db.getFirstSync('SELECT * FROM positions WHERE company_id = ? AND id = ?', [companyId, id]) as Position || null
  },

  create(data: Omit<Position, 'id' | 'created_at' | 'updated_at' | 'synced' | 'department'>): Position {
    const id = uuid()
    const now = new Date().toISOString()
    
    db.runSync(`
      INSERT INTO positions (id, company_id, department_id, title, base_salary, is_active, created_at, updated_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [id, data.company_id, data.department_id, data.title, data.base_salary, data.is_active, now, now])

    return {
      id,
      ...data,
      created_at: now,
      updated_at: now,
      synced: 0
    }
  },

  update(companyId: string, id: string, data: Partial<Position>): void {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'synced' && k !== 'department')
    const sets = keys.map(key => `${key} = ?`).join(', ')
    const values = keys.map(key => (data as any)[key])
    const now = new Date().toISOString()

    db.runSync(`
      UPDATE positions 
      SET ${sets}, updated_at = ?, synced = 0 
      WHERE company_id = ? AND id = ?
    `, [...values, now, companyId, id])
  },

  delete(companyId: string, id: string): void {
    // Soft delete
    db.runSync('UPDATE positions SET is_active = 0, synced = 0 WHERE company_id = ? AND id = ?', [companyId, id])
  }
}
