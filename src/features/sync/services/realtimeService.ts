import { supabase } from '@/services/supabase'
import { db } from '@/database/sqlite'

export const realtimeService = {
  subscribe: (companyId: string, onUpdate: () => void) => {
    console.log('🔌 Initializing Realtime Sync for company:', companyId)

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
        },
        async (payload) => {
          const { eventType, table, new: newRecord, old: oldRecord } = payload

          // Verify if the record belongs to the same company
          if (newRecord && (newRecord as any).company_id !== companyId) return

          try {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              const record = newRecord as any
              const fields = Object.keys(record)
              const placeholders = fields.map(() => '?').join(', ')
              const values = fields.map(f => record[f])

              const query = `INSERT OR REPLACE INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`
              db.runSync(query, values)
              console.log(`✅ Realtime: ${table} ${eventType} successful`)
            } else if (eventType === 'DELETE') {
              const query = `DELETE FROM ${table} WHERE id = ?`
              db.runSync(query, [(oldRecord as any).id])
              console.log(`✅ Realtime: ${table} DELETE successful`)
            }

            // Trigger UI refresh
            onUpdate()
          } catch (e) {
            console.error(`❌ Realtime error for table ${table}:`, e)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 Unsubscribing Realtime Sync')
      supabase.removeChannel(channel)
    }
  }
}
