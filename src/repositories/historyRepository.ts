import { db } from '@/database/sqlite'
import { HistoryEntry } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { addToSyncQueue } from '@/utils/syncData'

export const historyRepository = {
  getAll(companyId: string, limit: number = 50, offset: number = 0): HistoryEntry[] {
    return db.getAllSync<HistoryEntry>(
      'SELECT * FROM history WHERE company_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [companyId, limit, offset]
    )
  },
  log(companyId: string, action: string, tableName: string, recordId: string, userId: string, data: any): void {
    const entry: HistoryEntry = {
      id: generateUUID(),
      company_id: companyId,
      action,
      table_name: tableName,
      record_id: recordId,
      user_id: userId,
      data: JSON.stringify(data),
      created_at: new Date().toISOString()
    }

    db.runSync(
      `INSERT INTO history (id, company_id, action, table_name, record_id, user_id, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.company_id, entry.action, entry.table_name, entry.record_id, entry.user_id, entry.data, entry.created_at]
    )

    addToSyncQueue('history', 'INSERT', entry)
  }
}
