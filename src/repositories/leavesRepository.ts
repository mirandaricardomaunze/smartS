import { db } from '@/database/sqlite'
import { Leave } from '../features/hr/types'
import { uuid } from '@/utils/uuid'

function countCalendarDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, diff)
}

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
    return db.getAllSync(`
      SELECT l.*, e.name as employee_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.company_id = ? AND l.employee_id = ?
      ORDER BY l.start_date DESC
    `, [companyId, employeeId]) as Leave[]
  },

  /** Retorna true se o funcionário já tem uma licença aprovada/pendente no mesmo período */
  checkOverlap(
    companyId: string,
    employeeId: string,
    startDate: string,
    endDate: string,
    excludeId?: string
  ): boolean {
    const query = excludeId
      ? `SELECT COUNT(*) as count FROM leaves
         WHERE company_id = ? AND employee_id = ?
           AND status != 'rejected'
           AND start_date <= ? AND end_date >= ?
           AND id != ?`
      : `SELECT COUNT(*) as count FROM leaves
         WHERE company_id = ? AND employee_id = ?
           AND status != 'rejected'
           AND start_date <= ? AND end_date >= ?`

    const params = excludeId
      ? [companyId, employeeId, endDate, startDate, excludeId]
      : [companyId, employeeId, endDate, startDate]

    const result = db.getFirstSync<{ count: number }>(query, params)
    return (result?.count ?? 0) > 0
  },

  /** Dias de licença aprovados por tipo no ano indicado */
  getUsedDaysForYear(
    companyId: string,
    employeeId: string,
    year: number,
    type: string
  ): number {
    const result = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(
         CAST(julianday(end_date) - julianday(start_date) AS INTEGER) + 1
       ) as total
       FROM leaves
       WHERE company_id = ? AND employee_id = ? AND type = ?
         AND status = 'approved'
         AND strftime('%Y', start_date) = ?`,
      [companyId, employeeId, type, year.toString()]
    )
    return result?.total ?? 0
  },

  /** Resumo de saldo: dias alocados, usados e restantes */
  getVacationBalance(
    companyId: string,
    employeeId: string,
    year: number,
    allocatedDays: number = 22
  ): { allocated: number; used: number; remaining: number } {
    const used = this.getUsedDaysForYear(companyId, employeeId, year, 'vacation')
    return {
      allocated: allocatedDays,
      used,
      remaining: Math.max(0, allocatedDays - used),
    }
  },

  create(data: Omit<Leave, 'id' | 'created_at' | 'updated_at' | 'synced'>): Leave {
    // Validar sobreposição de datas
    if (this.checkOverlap(data.company_id, data.employee_id, data.start_date, data.end_date)) {
      throw new Error(
        'O funcionário já tem uma licença aprovada ou pendente nesse período. Verifique as datas.'
      )
    }

    // Validar datas
    if (data.start_date > data.end_date) {
      throw new Error('A data de início não pode ser posterior à data de fim.')
    }

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
  },

  delete(companyId: string, id: string): void {
    db.runSync(
      'DELETE FROM leaves WHERE company_id = ? AND id = ?',
      [companyId, id]
    )
  },
}
