import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { User } from '@/types'
import { generateUUID } from '@/utils/uuid'

export const usersRepository = {
  getAll(companyId: string): User[] {
    return db.getAllSync<User>(
      'SELECT * FROM users WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    )
  },
  getById(companyId: string, id: string): User | null {
    return db.getFirstSync<User>(
      'SELECT * FROM users WHERE id = ? AND company_id = ?', [id, companyId]
    ) ?? null
  },
  getByEmail(companyId: string, email: string): User | null {
    return db.getFirstSync<User>(
      'SELECT * FROM users WHERE email = ? AND company_id = ?', [email, companyId]
    ) ?? null
  },
  getGlobalByEmail(email: string): User | null {
    return db.getFirstSync<User>(
      'SELECT * FROM users WHERE email = ?', [email]
    ) ?? null
  },
  getGlobalCount(): number {
    return db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM users')?.count || 0
  },
  create(data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'synced'> & { id?: string }): User {
    const user: User = {
      ...data,
      id: data.id || generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
    }
    db.runSync(
      `INSERT INTO users (id, name, email, role, company_id, logo_url, is_active, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.name, user.email, user.role, user.company_id, user.logo_url, user.is_active, user.created_at, user.updated_at, user.synced]
    )
    addToSyncQueue('users', 'INSERT', user)
    return user
  },
  update(companyId: string, id: string, data: Partial<User>): void {
    const updated = { ...data, updated_at: new Date().toISOString(), synced: 0 }
    
    const fields = Object.keys(updated).filter(key => key !== 'id' && key !== 'company_id')
    const setClause = fields.map(key => `${key} = ?`).join(', ')
    const values = fields.map(key => (updated as any)[key])
    
    db.runSync(
      `UPDATE users SET ${setClause} WHERE id = ? AND company_id = ?`,
      [...values, id, companyId]
    )
    
    const current = this.getById(companyId, id)
    if (current) {
      addToSyncQueue('users', 'UPDATE', current)
    }
  },
  delete(companyId: string, id: string): void {
    const updated_at = new Date().toISOString()
    db.runSync('UPDATE users SET is_active=0, synced=0, updated_at=? WHERE id=? AND company_id=?', [updated_at, id, companyId])
    addToSyncQueue('users', 'UPDATE', { id, company_id: companyId, is_active: 0, updated_at })
  },
  updateGlobal(id: string, data: Partial<User>): void {
    const updated = { ...data, updated_at: new Date().toISOString(), synced: 0 }
    const fields = Object.keys(updated).filter(key => key !== 'id')
    const setClause = fields.map(key => `${key} = ?`).join(', ')
    const values = fields.map(key => (updated as any)[key])
    
    db.runSync(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, id]
    )
    
    const current = db.getFirstSync<User>('SELECT * FROM users WHERE id = ?', [id])
    if (current) {
      addToSyncQueue('users', 'UPDATE', current)
    }
  },
}
