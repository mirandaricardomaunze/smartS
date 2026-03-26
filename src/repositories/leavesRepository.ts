import { db } from '@/database/sqlite'
import { Leave } from '../features/hr/types'
import { uuid } from '@/utils/uuid'

export const leavesRepository = {
  getAll(companyId: string): Leave[] {
    return db.getAllSync(`
      SELECT l.*, e.name as employee_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.company_id = ?
      ORDER BY l.created_at DESC
    `, [companyId]) as Leave[]
  },

  getEmployeeLeaves(companyId: string, employeeId: string): Leave[] {
    return db.getAllSync('SELECT * FROM leaves WHERE company_id = ? AND employee_id = ? ORDER BY start_date DESC', [companyId, employeeId]) as Leave[]
  },

  create(data: Omit<Leave, 'id' | 'created_at' | 'updated_at' | 'synced'>): Leave {
    const id = uuid()
    const now = new Date().toISOString()
    
    db.runSync(`
      INSERT INTO leaves (
        id, company_id, employee_id, type, start_date, end_date, 
        status, reason, approved_by, created_at, updated_at, synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      id, data.company_id, data.employee_id, data.type, data.start_date, data.end_date,
      data.status, data.reason, data.approved_by, now, now
    ])

    return {
      id,
      ...data,
      created_at: now,
      updated_at: now,
      synced: 0
    }
  },

  updateStatus(companyId: string, id: string, status: string, approvedBy: string): void {
    const now = new Date().toISOString()
    db.runSync(`
      UPDATE leaves 
      SET status = ?, approved_by = ?, updated_at = ?, synced = 0 
      WHERE company_id = ? AND id = ?
    `, [status, approvedBy, now, companyId, id])
  }
}
