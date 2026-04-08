import { supabase } from '@/services/supabase'
import { db } from '@/database/sqlite'
import { logger } from '@/utils/logger'
import { ALLOWED_SYNC_TABLES, buildSafeInsert } from '@/utils/syncData'

export const realtimeService = {
  subscribe: (companyId: string, onUpdate: () => void) => {
    logger.debug('🔌 Realtime Sync iniciado para empresa:', companyId)

    const channel = supabase
      .channel(`db-changes-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const { eventType, table, new: newRecord, old: oldRecord } = payload

          // Security: only process tables in the whitelist
          if (!ALLOWED_SYNC_TABLES.has(table)) {
            logger.warn(`[realtime] Tabela ignorada: "${table}"`)
            return
          }

          // Security: only process records belonging to this company
          if (newRecord && (newRecord as Record<string, unknown>).company_id !== companyId) return

          try {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              const record = newRecord as Record<string, unknown>
              const safe = buildSafeInsert(table, record)
              if (!safe) {
                logger.warn(`[realtime] Sem colunas válidas para ${table}`)
                return
              }
              db.runSync(
                `INSERT OR REPLACE INTO ${table} (${safe.fields.join(', ')}) VALUES (${safe.placeholders})`,
                safe.values
              )
              logger.debug(`✅ Realtime ${eventType}: ${table}`)
            } else if (eventType === 'DELETE') {
              const id = (oldRecord as Record<string, unknown> | undefined)?.id
              if (!id || typeof id !== 'string') {
                logger.warn(`[realtime] DELETE em "${table}" sem id válido no oldRecord`)
                return
              }
              db.runSync(`DELETE FROM ${table} WHERE id = ?`, [id as string])
              logger.debug(`✅ Realtime DELETE: ${table}`)
            }

            onUpdate()
          } catch (e) {
            logger.error(`[realtime] Erro na tabela "${table}":`, e)
          }
        }
      )
      .subscribe()

    return () => {
      logger.debug('🔌 Realtime Sync encerrado')
      supabase.removeChannel(channel)
    }
  },
}
