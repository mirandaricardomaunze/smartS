import { db } from '@/database/sqlite'
import { Company } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export const companyRepository = {
  create(company: Omit<Company, 'id' | 'created_at' | 'synced'>): Company {
    const id = uuidv4()
    const created_at = new Date().toISOString()
    
    db.runSync(
      `INSERT INTO companies (id, name, nif, address, phone, email, logo_url, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, company.name, company.nif, company.address, company.phone, company.email, company.logo_url, created_at]
    )
    
    return {
      id,
      ...company,
      created_at,
      synced: 0
    }
  },

  update(id: string, company: Partial<Omit<Company, 'id' | 'created_at'>>): void {
    const fields = Object.keys(company)
    if (fields.length === 0) return

    const sets = fields.map(f => `${f} = ?`).join(', ')
    const values = [...Object.values(company), id]

    db.runSync(
      `UPDATE companies SET ${sets}, synced = 0 WHERE id = ?`,
      values
    )
  },

  getAll(): Company[] {
    return db.getAllSync<Company>('SELECT * FROM companies ORDER BY name ASC')
  },

  getById(id: string): Company | null {
    return db.getFirstSync<Company>('SELECT * FROM companies WHERE id = ?', [id]) || null
  },

  delete(id: string): void {
    db.runSync('DELETE FROM companies WHERE id = ?', [id])
  }
}
