import { supabase } from '@/services/supabase'
import { db } from '@/database/sqlite'

// Adds a record to the sync queue for later upload to Supabase
export function addToSyncQueue(
  tableName: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  data: object
): void {
  db.runSync(
    'INSERT INTO sync_queue (table_name, action, data) VALUES (?, ?, ?)',
    [tableName, action, JSON.stringify(data)]
  )
}

// Syncs all pending records from SQLite to Supabase
export async function syncData(): Promise<void> {
  // 1. Check for session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.warn('Sync skipped: No active session')
    return
  }

  const rows = db.getAllSync<{
    id: number
    table_name: string
    action: string
    data: string
    retry_count: number
  }>('SELECT * FROM sync_queue WHERE synced = 0 AND retry_count < 3')

  for (const row of rows) {
    try {
      const data = JSON.parse(row.data)
      
      let error = null
      if (row.action === 'INSERT' || row.action === 'UPDATE') {
        // Remove 'synced' field if it exists, as it's local-only
        const { synced, ...supabaseData } = data as any
        const { error: supabaseError } = await supabase.from(row.table_name).upsert(supabaseData)
        error = supabaseError
      } else if (row.action === 'DELETE') {
        const { error: supabaseError } = await supabase.from(row.table_name).delete().eq('id', data.id)
        error = supabaseError
      }

      if (error) throw error

      db.runSync('UPDATE sync_queue SET synced = 1, last_error = NULL WHERE id = ?', [row.id])
    } catch (e: any) {
      const errorMessage = e?.message || String(e)
      console.error(`Sync failed for ${row.table_name} (${row.id}):`, errorMessage)
      
      db.runSync(
        'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
        [errorMessage, row.id]
      )
    }
  }
}
