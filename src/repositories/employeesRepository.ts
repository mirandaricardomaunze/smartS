import { db } from '@/database/sqlite'
import { Employee } from '../features/hr/types'
import { uuid } from '@/utils/uuid'

export const employeesRepository = {
  getAll(companyId: string, limit: number = 20, offset: number = 0): Employee[] {
    return db.getAllSync(`
      SELECT e.*, p.title as position, d.name as department
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE e.company_id = ? AND e.is_active = 1
      ORDER BY e.name ASC
      LIMIT ? OFFSET ?
    `, [companyId, limit, offset]) as Employee[]
  },

  getById(companyId: string, id: string): Employee | null {
    return db.getFirstSync(`
      SELECT e.*, p.title as position, d.name as department
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE e.company_id = ? AND e.id = ?
    `, [companyId, id]) as Employee || null
  },

  create(data: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'synced' | 'position' | 'department'>): Employee {
    const id = uuid()
    const now = new Date().toISOString()
    
    db.runSync(`
      INSERT INTO employees (
        id, company_id, position_id, name, bi_number, nit, address, contacts, 
        photo_url, employment_type, status, contract_start_date, contract_end_date, 
        emergency_contact, bank_details, nacionality, civil_status, bank_name, 
        bank_account, nib, is_active, created_at, updated_at, synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      id, data.company_id, data.position_id, data.name, data.bi_number, data.nit, data.address, data.contacts,
      data.photo_url, data.employment_type, data.status, data.contract_start_date, data.contract_end_date,
      data.emergency_contact, data.bank_details, data.nacionality, data.civil_status, data.bank_name,
      data.bank_account, data.nib, data.is_active, now, now
    ])

    return {
      id,
      ...data,
      created_at: now,
      updated_at: now,
      synced: 0
    }
  },

  update(companyId: string, id: string, data: Partial<Employee>): void {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'synced' && k !== 'position' && k !== 'department')
    const sets = keys.map(key => `${key} = ?`).join(', ')
    const values = keys.map(key => (data as any)[key])
    const now = new Date().toISOString()

    db.runSync(`
      UPDATE employees 
      SET ${sets}, updated_at = ?, synced = 0 
      WHERE company_id = ? AND id = ?
    `, [...values, now, companyId, id])
  },

  delete(companyId: string, id: string): void {
    // Soft delete
    db.runSync('UPDATE employees SET is_active = 0, synced = 0 WHERE company_id = ? AND id = ?', [companyId, id])
  }
}
