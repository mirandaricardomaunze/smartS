import { addToSyncQueue, ALLOWED_SYNC_TABLES, TABLE_COLUMNS, buildSafeInsert } from '../../utils/syncData'

// Mock external dependencies
jest.mock('@/database/sqlite', () => ({
  db: {
    runSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(),
  }
}))

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn(() => ({ data: { session: null } })) },
    from: jest.fn(),
  }
}))

jest.mock('@/store/networkStore', () => ({
  useNetworkStore: {
    getState: jest.fn(() => ({ isOnline: true })),
  }
}))

jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))

describe('ALLOWED_SYNC_TABLES', () => {
  it('should contain core tables', () => {
    expect(ALLOWED_SYNC_TABLES.has('products')).toBe(true)
    expect(ALLOWED_SYNC_TABLES.has('categories')).toBe(true)
    expect(ALLOWED_SYNC_TABLES.has('stock_movements')).toBe(true)
    expect(ALLOWED_SYNC_TABLES.has('orders')).toBe(true)
  })

  it('should contain HR tables', () => {
    expect(ALLOWED_SYNC_TABLES.has('employees')).toBe(true)
    expect(ALLOWED_SYNC_TABLES.has('attendance')).toBe(true)
    expect(ALLOWED_SYNC_TABLES.has('leaves')).toBe(true)
    expect(ALLOWED_SYNC_TABLES.has('payroll')).toBe(true)
  })

  it('should NOT contain internal tables', () => {
    expect(ALLOWED_SYNC_TABLES.has('migrations')).toBe(false)
    expect(ALLOWED_SYNC_TABLES.has('sync_queue')).toBe(false)
    expect(ALLOWED_SYNC_TABLES.has('notifications')).toBe(false)
  })
})

describe('TABLE_COLUMNS', () => {
  it('should have column whitelist for all allowed tables', () => {
    for (const table of ALLOWED_SYNC_TABLES) {
      expect(TABLE_COLUMNS[table]).toBeDefined()
      expect(TABLE_COLUMNS[table].size).toBeGreaterThan(0)
    }
  })

  it('products whitelist should include all expected columns', () => {
    const productCols = TABLE_COLUMNS['products']
    expect(productCols.has('id')).toBe(true)
    expect(productCols.has('name')).toBe(true)
    expect(productCols.has('barcode')).toBe(true)
    expect(productCols.has('reference')).toBe(true)
    expect(productCols.has('company_id')).toBe(true)
    expect(productCols.has('purchase_price')).toBe(true)
    expect(productCols.has('sale_price')).toBe(true)
  })

  it('should NOT include UI-only fields', () => {
    const productCols = TABLE_COLUMNS['products']
    expect(productCols.has('category')).toBe(false) // joined field
    expect(productCols.has('supplier')).toBe(false) // joined field
  })
})

describe('buildSafeInsert', () => {
  it('should filter out non-whitelisted columns', () => {
    const record = {
      id: 'test-id',
      name: 'Arroz',
      company_id: 'comp-1',
      malicious_field: 'DROP TABLE',
      __proto_pollution__: 'attack',
    }

    const result = buildSafeInsert('products', record)
    expect(result).not.toBeNull()
    expect(result!.fields).toContain('id')
    expect(result!.fields).toContain('name')
    expect(result!.fields).toContain('company_id')
    expect(result!.fields).not.toContain('malicious_field')
    expect(result!.fields).not.toContain('__proto_pollution__')
  })

  it('should return null for unknown tables', () => {
    const result = buildSafeInsert('unknown_table', { id: '1' })
    expect(result).toBeNull()
  })

  it('should return null for empty record (no whitelisted fields)', () => {
    const result = buildSafeInsert('products', { nonsense: true })
    expect(result).toBeNull()
  })

  it('should produce valid SQL structure', () => {
    const result = buildSafeInsert('categories', {
      id: 'cat-1',
      company_id: 'comp-1',
      name: 'Alimentos',
    })

    expect(result).not.toBeNull()
    expect(result!.fields.length).toBe(3)
    expect(result!.placeholders).toBe('?, ?, ?')
    expect(result!.values).toEqual(['cat-1', 'comp-1', 'Alimentos'])
  })
})

describe('addToSyncQueue', () => {
  const { db } = require('@/database/sqlite')

  beforeEach(() => jest.clearAllMocks())

  it('should insert into sync_queue for valid table', () => {
    addToSyncQueue('products', 'INSERT', { id: '123', name: 'Test' })
    expect(db.runSync).toHaveBeenCalledWith(
      'INSERT INTO sync_queue (table_name, action, data) VALUES (?, ?, ?)',
      ['products', 'INSERT', JSON.stringify({ id: '123', name: 'Test' })]
    )
  })

  it('should reject non-whitelisted tables', () => {
    addToSyncQueue('malicious_table', 'INSERT', { evil: true })
    expect(db.runSync).not.toHaveBeenCalled()
  })

  it('should reject internal tables like sync_queue', () => {
    addToSyncQueue('sync_queue', 'INSERT', { data: 'test' })
    expect(db.runSync).not.toHaveBeenCalled()
  })
})
