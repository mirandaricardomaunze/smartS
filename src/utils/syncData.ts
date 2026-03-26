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

// Fetches remote changes from Supabase to SQLite
export async function pullFromSupabase(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const companyId = session.user.user_metadata.company_id
  if (!companyId) return

  const tables = [
    'categories',
    'suppliers',
    'products',
    'customers',
    'orders',
    'order_items',
    'stock_movements',
    'expiry_lots',
    'financial_transactions'
  ]

  for (const table of tables) {
    try {
      // 1. Get last updated record from local SQLite to optimize pull
      // Note: For now we'll do a full fetch or a simple high-water mark if updated_at exists
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('company_id', companyId)
      
      if (error) throw error
      if (!data || data.length === 0) continue

      // 2. Perform upsert into SQLite
      for (const record of data) {
        const fields = Object.keys(record)
        const placeholders = fields.map(() => '?').join(', ')
        const values = fields.map(f => record[f])
        
        // We use INSERT OR REPLACE (upsert)
        const query = `INSERT OR REPLACE INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`
        db.runSync(query, values)
      }
    } catch (e) {
      console.error(`Failed to pull table ${table}:`, e)
    }
  }
}
