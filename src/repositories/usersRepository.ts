import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { User } from '@/types'
import { generateUUID } from '@/utils/uuid'

export const usersRepository = {
  getAll(): User[] {
    return db.getAllSync<User>(
      'SELECT * FROM users ORDER BY name ASC'
    )
  },
  getById(id: string): User | null {
    return db.getFirstSync<User>(
      'SELECT * FROM users WHERE id = ?', [id]
    ) ?? null
  },
  getByEmail(email: string): User | null {
    return db.getFirstSync<User>(
      'SELECT * FROM users WHERE email = ?', [email]
    ) ?? null
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
  update(id: string, data: Partial<User>): void {
    const updated = { ...data, updated_at: new Date().toISOString(), synced: 0 }
    
    const setClause = Object.keys(updated)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = Object.values(updated)
    
    db.runSync(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, id]
    )
    
    const current = this.getById(id)
    if (current) {
      addToSyncQueue('users', 'UPDATE', current)
    }
  },
  delete(id: string): void {
    const updated_at = new Date().toISOString()
    db.runSync('UPDATE users SET is_active=0, synced=0, updated_at=? WHERE id=?', [updated_at, id])
    addToSyncQueue('users', 'UPDATE', { id, is_active: 0, updated_at })
  },
}
