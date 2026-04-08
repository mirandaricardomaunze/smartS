import { db } from '@/database/sqlite'
import { Payroll } from '../features/hr/types'
import { uuid } from '@/utils/uuid'

export const payrollRepository = {
  getByPeriod(companyId: string, month: number, year: number): Payroll[] {
    return db.getAllSync(`
      SELECT p.*, e.name as employee_name
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.company_id = ? AND p.period_month = ? AND p.period_year = ?
      ORDER BY e.name ASC
    `, [companyId, month, year]) as Payroll[]
  },

  getEmployeePayroll(companyId: string, employeeId: string): Payroll[] {
    return db.getAllSync(
      'SELECT * FROM payroll WHERE company_id = ? AND employee_id = ? ORDER BY period_year DESC, period_month DESC',
      [companyId, employeeId]
    ) as Payroll[]
  },

  /** Cria ou actualiza o recibo de vencimento do funcionário para o período indicado (upsert). */
  create(data: Omit<Payroll, 'id' | 'created_at' | 'updated_at' | 'synced'>): Payroll {
    const now = new Date().toISOString()

    // Verificar se já existe registo para este funcionário no mesmo período
    const existing = db.getFirstSync<Payroll>(
      `SELECT * FROM payroll
       WHERE company_id = ? AND employee_id = ? AND period_month = ? AND period_year = ?`,
      [data.company_id, data.employee_id, data.period_month, data.period_year]
    )

    if (existing) {
      // Actualizar registo existente em vez de criar duplicado
      db.runSync(`
        UPDATE payroll SET
          base_salary = ?, overtime_pay = ?, bonus = ?,
          subsidy_meal = ?, subsidy_transport = ?,
          deduction_inss = ?, deduction_irps = ?, deduction_other = ?,
          net_salary = ?, status = ?, updated_at = ?, synced = 0
        WHERE id = ?
      `, [
        data.base_salary, data.overtime_pay, data.bonus,
        data.subsidy_meal, data.subsidy_transport,
        data.deduction_inss, data.deduction_irps, data.deduction_other,
        data.net_salary, data.status, now, existing.id
      ])

      return { ...existing, ...data, updated_at: now, synced: 0 }
    }

    // Criar novo registo
    const id = uuid()
    db.runSync(`
      INSERT INTO payroll (
        id, company_id, employee_id, period_month, period_year,
        base_salary, overtime_pay, bonus, subsidy_meal, subsidy_transport,
        deduction_inss, deduction_irps, deduction_other, net_salary,
        status, created_at, updated_at, synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      id, data.company_id, data.employee_id, data.period_month, data.period_year,
      data.base_salary, data.overtime_pay, data.bonus, data.subsidy_meal, data.subsidy_transport,
      data.deduction_inss, data.deduction_irps, data.deduction_other, data.net_salary,
      data.status, now, now
    ])

    return { id, ...data, created_at: now, updated_at: now, synced: 0 }
  },

  updateStatus(companyId: string, id: string, status: 'processed' | 'paid'): void {
    const now = new Date().toISOString()
    db.runSync(`
      UPDATE payroll
      SET status = ?, updated_at = ?, synced = 0
      WHERE company_id = ? AND id = ?
    `, [status, now, companyId, id])
  },

  lockPeriod(companyId: string, month: number, year: number): void {
    const now = new Date().toISOString()
    db.runSync(`
      UPDATE payroll
      SET status = 'paid', payment_date = ?, updated_at = ?, synced = 0
      WHERE company_id = ? AND period_month = ? AND period_year = ? AND status = 'processed'
    `, [now, now, companyId, month, year])
  },

  getPeriodTotals(companyId: string, month: number, year: number) {
    return db.getFirstSync(`
      SELECT
        SUM(base_salary) as total_base,
        SUM(deduction_inss) as total_inss_employee,
        SUM(deduction_irps) as total_irps,
        SUM(net_salary) as total_net,
        COUNT(*) as employee_count
      FROM payroll
      WHERE company_id = ? AND period_month = ? AND period_year = ?
    `, [companyId, month, year]) as any
  },

  delete(companyId: string, id: string): void {
    db.runSync(
      'DELETE FROM payroll WHERE company_id = ? AND id = ?',
      [companyId, id]
    )
  },
}
