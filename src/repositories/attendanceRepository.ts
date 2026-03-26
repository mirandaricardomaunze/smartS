import { db } from '@/database/sqlite'
import { Attendance } from '../features/hr/types'
import { uuid } from '@/utils/uuid'

export const attendanceRepository = {
  getToday(companyId: string, date: string): Attendance[] {
    return db.getAllSync(`
      SELECT a.*, e.name as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.company_id = ? AND a.date = ?
    `, [companyId, date]) as Attendance[]
  },

  getAll(companyId: string): Attendance[] {
    return db.getAllSync('SELECT * FROM attendance WHERE company_id = ? ORDER BY date DESC, clock_in DESC', [companyId]) as Attendance[]
  },

  getEmployeeAttendance(companyId: string, employeeId: string): Attendance[] {
    return db.getAllSync('SELECT * FROM attendance WHERE company_id = ? AND employee_id = ? ORDER BY date DESC', [companyId, employeeId]) as Attendance[]
  },

  create(data: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'synced'>): Attendance {
    const id = uuid()
    const now = new Date().toISOString()
    
    db.runSync(`
      INSERT INTO attendance (
        id, company_id, employee_id, date, clock_in, clock_out,
        breaks, status, justification, total_minutes, created_at, updated_at, synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      id, data.company_id, data.employee_id, data.date, data.clock_in, data.clock_out,
      data.breaks, data.status, data.justification, data.total_minutes, now, now
    ])

    return {
      id,
      ...data,
      created_at: now,
      updated_at: now,
      synced: 0
    }
  },

  update(companyId: string, id: string, data: Partial<Attendance>): void {
    const now = new Date().toISOString()
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'company_id')
    const fields = keys.map(key => `${key} = ?`).join(', ')
    const values = keys.map(key => (data as any)[key])
    
    db.runSync(`
      UPDATE attendance 
      SET ${fields}, updated_at = ?, synced = 0 
      WHERE company_id = ? AND id = ?
    `, [...values, now, companyId, id])
  },

  getPeriodSummary(companyId: string, month: string, year: string) {
    const period = `${year}-${month}`
    return db.getAllSync(`
      SELECT 
        e.id,
        e.name as employee_name,
        COUNT(a.id) as present_days,
        SUM(a.total_minutes) as total_minutes
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND a.date LIKE ?
      WHERE e.company_id = ? AND e.is_active = 1
      GROUP BY e.id
    `, [`${period}%`, companyId])
  }
}
