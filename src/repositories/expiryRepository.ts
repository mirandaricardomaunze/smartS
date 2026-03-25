import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { ExpiryLot } from '@/types'
import { generateUUID } from '@/utils/uuid'

export const expiryRepository = {
  getAll(): ExpiryLot[] {
    return db.getAllSync<ExpiryLot>(
      'SELECT * FROM expiry_lots ORDER BY expiry_date ASC'
    )
  },
  getByProductId(productId: string): ExpiryLot[] {
    return db.getAllSync<ExpiryLot>(
      'SELECT * FROM expiry_lots WHERE product_id = ? ORDER BY expiry_date ASC', [productId]
    )
  },
  create(data: Omit<ExpiryLot, 'id' | 'created_at' | 'updated_at' | 'synced'>): ExpiryLot {
    const lot: ExpiryLot = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
    }
    db.runSync(
      `INSERT INTO expiry_lots (id, company_id, product_id, lot_number, expiry_date, quantity, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lot.id, lot.company_id, lot.product_id, lot.lot_number, lot.expiry_date, lot.quantity, lot.created_at, lot.updated_at, lot.synced]
    )
    addToSyncQueue('expiry_lots', 'INSERT', lot)
    return lot
  },
  update(id: string, data: Partial<ExpiryLot>): void {
    const updated = { ...data, updated_at: new Date().toISOString(), synced: 0 }
    
    const setClause = Object.keys(updated)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = Object.values(updated)
    
    db.runSync(
      `UPDATE expiry_lots SET ${setClause} WHERE id = ?`,
      [...values, id]
    )

    const current = db.getFirstSync<ExpiryLot>('SELECT * FROM expiry_lots WHERE id = ?', [id])
    if (current) {
      addToSyncQueue('expiry_lots', 'UPDATE', current)
    }
  },
  delete(id: string): void {
    db.runSync('DELETE FROM expiry_lots WHERE id=?', [id])
    addToSyncQueue('expiry_lots', 'DELETE', { id })
  },
}
