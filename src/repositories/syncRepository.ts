import { db } from '@/database/sqlite'

export interface SyncQueueItem {
  id: number
  table_name: string
  action: string
  data: string
  synced: number
  retry_count: number
  last_error: string | null
  created_at: string
}

export const syncRepository = {
  getPending(companyId: string): SyncQueueItem[] {
    return db.getAllSync<SyncQueueItem>(
      'SELECT id, table_name, action, data, synced, retry_count, last_error, created_at FROM sync_queue WHERE company_id = ? AND synced = 0 ORDER BY created_at ASC',
      [companyId]
    )
  },
  getErrors(): SyncQueueItem[] {
      return db.getAllSync<SyncQueueItem>(
        'SELECT id, table_name, action, data, synced, retry_count, last_error, created_at FROM sync_queue WHERE synced = 0 AND retry_count > 0 ORDER BY created_at ASC'
      )
  },
  markSynced(id: number): void {
    db.runSync('UPDATE sync_queue SET synced = 1 WHERE id = ?', [id])
  },
  incrementRetry(id: number): void {
    db.runSync('UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?', [id])
  },
  getStats(): { pending: number; errors: number } {
    const pending = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0'
    )?.count || 0

    const errors = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0 AND retry_count >= 3'
    )?.count || 0

    return { pending, errors }
  },
  addToQueue(tableName: string, action: string, data: any): void {
    const companyId = data.company_id || null
    db.runSync(
      'INSERT INTO sync_queue (company_id, table_name, action, data, synced, retry_count, last_error, created_at) VALUES (?, ?, ?, ?, 0, 0, NULL, ?)',
      [companyId, tableName, action, JSON.stringify(data), new Date().toISOString()]
    )
  }
}
