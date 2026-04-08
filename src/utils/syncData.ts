import { supabase } from '@/services/supabase'
import { db } from '@/database/sqlite'
import { logger } from '@/utils/logger'
import type { SQLiteBindValue } from 'expo-sqlite'
import { useNetworkStore } from '@/store/networkStore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '@/features/auth/store/authStore'

// ── Sync mutex ───────────────────────────────────────────────────────────────
let isSyncing = false
let isPulling = false

const LAST_PULL_KEY = 'sync:lastPullAt'
const PULL_PAGE_SIZE = 500

/** Returns true when the error is clearly a connectivity issue, not a server/logic error. */
function isNetworkError(e: unknown): boolean {
  if (!(e instanceof Error)) return false
  const msg = e.message.toLowerCase()
  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('no internet')
  )
}

/**
 * Whitelist of tables allowed in dynamic SQL operations.
 * Prevents SQL injection via malicious Supabase realtime payloads.
 */
export const ALLOWED_SYNC_TABLES = new Set([
  'categories',
  'suppliers',
  'products',
  'customers',
  'orders',
  'order_items',
  'stock_movements',
  'expiry_lots',
  'financial_transactions',
  'notes',
  'history',
  'users',
  'employees',
  'attendance',
  'leaves',
  'payroll',
  'subscriptions',
  'companies',
])

/**
 * Per-table column whitelists derived from the SQLite schema.
 * Only columns present here will be written during sync operations,
 * preventing SQL injection via crafted field names in Supabase payloads.
 */
export const TABLE_COLUMNS: Record<string, Set<string>> = {
  categories: new Set(['id', 'company_id', 'name', 'description', 'created_at', 'updated_at', 'synced']),
  suppliers: new Set(['id', 'company_id', 'name', 'contact_name', 'email', 'phone', 'address', 'nif', 'created_at', 'updated_at', 'synced']),
  products: new Set(['id', 'name', 'barcode', 'sku', 'category_id', 'brand', 'unit', 'units_per_box', 'boxes_per_pallet', 'minimum_stock', 'current_stock', 'description', 'image_url', 'is_active', 'created_at', 'updated_at', 'synced', 'purchase_price', 'sale_price', 'tax_rate', 'company_id', 'supplier_id', 'expiry_date', 'reference']),
  customers: new Set(['id', 'company_id', 'name', 'email', 'phone', 'address', 'nif', 'created_at', 'updated_at', 'synced']),
  orders: new Set(['id', 'company_id', 'customer_id', 'user_id', 'number', 'status', 'total_amount', 'discount', 'tax_amount', 'notes', 'created_at', 'updated_at', 'synced', 'customer_name']),
  order_items: new Set(['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'tax_rate', 'total']),
  stock_movements: new Set(['id', 'product_id', 'type', 'quantity', 'user_id', 'reason', 'created_at', 'updated_at', 'synced', 'company_id']),
  expiry_lots: new Set(['id', 'product_id', 'lot_number', 'expiry_date', 'quantity', 'created_at', 'updated_at', 'synced', 'company_id']),
  financial_transactions: new Set(['id', 'company_id', 'type', 'category', 'amount', 'description', 'date', 'status', 'related_type', 'related_id', 'created_at', 'updated_at', 'synced']),
  notes: new Set(['id', 'number', 'type', 'user_id', 'items', 'created_at', 'updated_at', 'synced', 'company_id']),
  history: new Set(['id', 'action', 'table_name', 'record_id', 'user_id', 'data', 'created_at', 'updated_at', 'company_id']),
  users: new Set(['id', 'name', 'email', 'role', 'company_id', 'logo_url', 'is_active', 'created_at', 'updated_at', 'synced']),
  employees: new Set(['id', 'company_id', 'position_id', 'name', 'bi_number', 'nit', 'address', 'contacts', 'photo_url', 'employment_type', 'status', 'contract_start_date', 'contract_end_date', 'emergency_contact', 'bank_details', 'is_active', 'created_at', 'updated_at', 'synced', 'nacionality', 'civil_status', 'bank_name', 'bank_account', 'nib']),
  attendance: new Set(['id', 'company_id', 'employee_id', 'date', 'clock_in', 'clock_out', 'breaks', 'status', 'justification', 'total_minutes', 'created_at', 'updated_at', 'synced']),
  leaves: new Set(['id', 'company_id', 'employee_id', 'type', 'start_date', 'end_date', 'status', 'reason', 'approved_by', 'created_at', 'updated_at', 'synced']),
  payroll: new Set(['id', 'company_id', 'employee_id', 'period_month', 'period_year', 'base_salary', 'overtime_pay', 'bonus', 'subsidy_meal', 'subsidy_transport', 'deduction_inss', 'deduction_irps', 'deduction_other', 'net_salary', 'status', 'payment_date', 'created_at', 'updated_at', 'synced']),
  subscriptions: new Set(['company_id', 'trial_started_at', 'trial_ends_at', 'plan', 'trial_expired', 'onboarding_completed', 'created_at', 'updated_at', 'synced']),
  companies: new Set(['id', 'name', 'nif', 'address', 'phone', 'email', 'logo_url', 'created_at', 'updated_at', 'synced']),
}

/**
 * Filters a record to only include columns in the table's whitelist,
 * then builds the SQL fields/placeholders/values for an INSERT OR REPLACE.
 * Returns null if no whitelisted columns are found.
 */
export function buildSafeInsert(
  table: string,
  record: Record<string, unknown>
): { fields: string[]; placeholders: string; values: SQLiteBindValue[] } | null {
  const allowed = TABLE_COLUMNS[table]
  if (!allowed) return null
  const fields = Object.keys(record).filter(f => allowed.has(f))
  if (fields.length === 0) return null
  return {
    fields,
    placeholders: fields.map(() => '?').join(', '),
    values: fields.map(f => record[f] as SQLiteBindValue),
  }
}

/**
 * Fields stripped before sending to Supabase — local-only or virtual columns.
 */
const LOCAL_ONLY_FIELDS = new Set([
  'synced',
  'category',
  'supplier',
  'category_name',
  'supplier_name',
  'customer_name',
  'low_stock_count',
  'total_debt',
])

// Adds a record to the sync queue for later upload to Supabase
export function addToSyncQueue(
  tableName: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  data: object
): void {
  if (!ALLOWED_SYNC_TABLES.has(tableName)) {
    logger.warn(`[syncData] addToSyncQueue: tabela não permitida "${tableName}"`)
    return
  }
  db.runSync(
    'INSERT INTO sync_queue (table_name, action, data) VALUES (?, ?, ?)',
    [tableName, action, JSON.stringify(data)]
  )
}

// Syncs all pending records from SQLite to Supabase (with mutex)
export async function syncData(): Promise<void> {
  if (isSyncing) {
    logger.debug('[syncData] Já em execução — ignorado')
    return
  }

  if (!useNetworkStore.getState().isOnline) {
    logger.debug('[syncData] Offline: sync ignorado')
    return
  }

  isSyncing = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      logger.warn('[syncData] Sync ignorado: sem sessão activa')
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
      // Extra guard: skip tables not in whitelist (data from older queue entries)
      if (!ALLOWED_SYNC_TABLES.has(row.table_name)) {
        logger.warn(`[syncData] Tabela ignorada na fila: "${row.table_name}"`)
        db.runSync('UPDATE sync_queue SET synced = 1 WHERE id = ?', [row.id])
        continue
      }

      try {
        let error = null

        if (row.action === 'INSERT' || row.action === 'UPDATE') {
          let rawData: Record<string, unknown>
          try {
            rawData = JSON.parse(row.data)
          } catch {
            throw new Error('Dados corrompidos na fila de sync (JSON inválido)')
          }

          // Strip local-only fields before sending to Supabase
          const supabaseData = Object.fromEntries(
            Object.entries(rawData).filter(([key]) => !LOCAL_ONLY_FIELDS.has(key))
          )

          // Fallback: ensure company_id is present
          if (!supabaseData.company_id && session.user.user_metadata.company_id) {
            supabaseData.company_id = session.user.user_metadata.company_id
          }

          // Fallback: ensure user_id for tables that require it
          const tablesWithUserId = new Set(['stock_movements', 'orders', 'history'])
          if (!supabaseData.user_id && session.user.id && tablesWithUserId.has(row.table_name)) {
            supabaseData.user_id = session.user.id
          }

          const { error: supabaseError } = await supabase.from(row.table_name).upsert(supabaseData)
          error = supabaseError
        } else if (row.action === 'DELETE') {
          const data = JSON.parse(row.data) as { id: string }
          const { error: supabaseError } = await supabase
            .from(row.table_name)
            .delete()
            .eq('id', data.id)
          error = supabaseError
        }

        if (error) throw error

        db.runSync('UPDATE sync_queue SET synced = 1, last_error = NULL WHERE id = ?', [row.id])
      } catch (e: unknown) {
        if (isNetworkError(e)) {
          logger.debug('[syncData] Sem rede: a aguardar reconexão')
          break // pointless to try remaining rows without connectivity
        }
        const errorMessage = e instanceof Error ? e.message : String(e)
        logger.error(`[syncData] Falha ao sincronizar ${row.table_name} (id=${row.id}):`, errorMessage)
        db.runSync(
          'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
          [errorMessage, row.id]
        )
      }
    }

    // Clean up permanently failed items (retry_count >= 3, older than 7 days)
    db.runSync(
      `DELETE FROM sync_queue
       WHERE synced = 0 AND retry_count >= 3
       AND created_at < datetime('now', '-7 days')`
    )
  } finally {
    isSyncing = false
  }
}

// ── Pull from Supabase (with mutex, pagination, and delta sync) ─────────────

/** All tables that should be pulled from Supabase */
const PULL_TABLES = [
  'categories',
  'suppliers',
  'products',
  'customers',
  'orders',
  'order_items',
  'stock_movements',
  'expiry_lots',
  'financial_transactions',
  'notes',
  'history',
  'users',
  'employees',
  'attendance',
  'leaves',
  'payroll',
  'subscriptions',
  'companies',
]

/** Tables that don't have an updated_at column (cannot delta sync) */
const TABLES_WITHOUT_UPDATED_AT = new Set([
  'order_items',
  'sync_queue',
])

/**
 * Fetches remote changes from Supabase to SQLite.
 * Uses delta sync (only records changed since last pull) and pagination.
 */
export async function pullFromSupabase(): Promise<void> {
  if (isPulling) {
    logger.debug('[pullFromSupabase] Já em execução — ignorado')
    return
  }

  if (!useNetworkStore.getState().isOnline) {
    logger.debug('[pullFromSupabase] Offline: pull ignorado')
    return
  }

  isPulling = true
  try {
    const { user } = useAuthStore.getState()
    const isSuperAdmin = user?.role === 'super_admin'
    const companyId = user?.company_id

    // Get last pull timestamp for delta sync
    const lastPullAt = await AsyncStorage.getItem(LAST_PULL_KEY)
    const pullStartedAt = new Date().toISOString()

    for (const table of PULL_TABLES) {
      // Special case: Companies table should be pulled entirely for super_admin
      // or if we are a regular user, we only see our own via RLS anyway.
      const isCompanyTable = table === 'companies'
      
      try {
        let offset = 0
        let hasMore = true

        while (hasMore) {
          let query = supabase
            .from(table)
            .select('*')

          // Only apply company_id filter if NOT super_admin OR if the table is NOT 'companies'
          // Actually, regular users only get their own data via RLS, but adding the filter is safer.
          if (!isSuperAdmin && !isCompanyTable && companyId) {
            query = query.eq('company_id', companyId)
          }

          query = query.range(offset, offset + PULL_PAGE_SIZE - 1)

          // Delta sync: only pull records updated since last pull
          if (lastPullAt && !TABLES_WITHOUT_UPDATED_AT.has(table)) {
            query = query.gte('updated_at', lastPullAt)
          }

          const { data, error } = await query

          if (error) throw error
          if (!data || data.length === 0) {
            hasMore = false
            continue
          }

          for (const record of data) {
            const safe = buildSafeInsert(table, record as Record<string, unknown>)
            if (!safe) continue
            db.runSync(
              `INSERT OR REPLACE INTO ${table} (${safe.fields.join(', ')}) VALUES (${safe.placeholders})`,
              safe.values
            )
          }

          // If we got fewer records than the page size, we're done
          if (data.length < PULL_PAGE_SIZE) {
            hasMore = false
          } else {
            offset += PULL_PAGE_SIZE
          }
        }
      } catch (e) {
        if (isNetworkError(e)) {
          logger.debug('[pullFromSupabase] Sem rede: a aguardar reconexão')
          break // no point trying remaining tables
        }
        logger.error(`[syncData] Falha ao puxar tabela "${table}":`, e)
      }
    }

    // Save the pull timestamp for next delta sync
    await AsyncStorage.setItem(LAST_PULL_KEY, pullStartedAt)
  } finally {
    isPulling = false
  }
}
