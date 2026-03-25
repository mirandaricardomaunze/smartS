import * as SQLite from 'expo-sqlite'

export const db = SQLite.openDatabaseSync('stockapp.db')

export async function initDatabase() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

export async function runMigrations() {
  await initDatabase()

  const migrations = [
    {
      name: '001_sync_queue',
      query: `
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          action TEXT NOT NULL,
          data TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          retry_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `
    },
    {
      name: '002_products',
      query: `
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          barcode TEXT,
          sku TEXT NOT NULL,
          category TEXT NOT NULL,
          brand TEXT,
          unit TEXT NOT NULL DEFAULT 'un',
          units_per_box INTEGER,
          boxes_per_pallet INTEGER,
          minimum_stock INTEGER NOT NULL DEFAULT 0,
          current_stock INTEGER NOT NULL DEFAULT 0,
          description TEXT,
          image_url TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_products_synced ON products(synced);
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      `
    },
    {
      name: '003_movements',
      query: `
        CREATE TABLE IF NOT EXISTS movements (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          reason TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (product_id) REFERENCES products(id)
        );
        CREATE INDEX IF NOT EXISTS idx_movements_synced ON movements(synced);
        CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
      `
    },
    {
      name: '004_users',
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL DEFAULT 'operator',
          company TEXT,
          logo_url TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_users_synced ON users(synced);
      `
    },
    {
      name: '005_history',
      query: `
        CREATE TABLE IF NOT EXISTS history (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          table_name TEXT NOT NULL,
          record_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_history_table ON history(table_name);
        CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
      `
    },
    {
      name: '006_expiry',
      query: `
        CREATE TABLE IF NOT EXISTS expiry_lots (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          lot_number TEXT NOT NULL,
          expiry_date TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (product_id) REFERENCES products(id)
        );
        CREATE INDEX IF NOT EXISTS idx_expiry_synced ON expiry_lots(synced);
        CREATE INDEX IF NOT EXISTS idx_expiry_date ON expiry_lots(expiry_date);
      `
    },
    {
      name: '007_notes',
      query: `
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          number TEXT NOT NULL,
          type TEXT NOT NULL,
          user_id TEXT NOT NULL,
          items TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_notes_synced ON notes(synced);
      `
    },
    {
      name: '008_notifications',
      query: `
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'info',
          is_read INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      `
    },
    {
      name: '009_sync_queue_error_logging',
      query: `
        ALTER TABLE sync_queue ADD COLUMN last_error TEXT;
      `
    },
    {
      name: '010_product_pricing',
      query: `
        ALTER TABLE products ADD COLUMN purchase_price REAL;
        ALTER TABLE products ADD COLUMN sale_price REAL;
        ALTER TABLE products ADD COLUMN tax_rate REAL;
      `
    },
    {
      name: '011_companies_and_tenancy',
      query: `
        CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          nif TEXT,
          address TEXT,
          phone TEXT,
          email TEXT,
          logo_url TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0
        );

        -- Add company_id to existing tables
        ALTER TABLE products ADD COLUMN company_id TEXT;
        ALTER TABLE movements ADD COLUMN company_id TEXT;
        ALTER TABLE users RENAME COLUMN company TO company_id; -- User company field refactored
        ALTER TABLE expiry_lots ADD COLUMN company_id TEXT;
        ALTER TABLE notes ADD COLUMN company_id TEXT;
        ALTER TABLE history ADD COLUMN company_id TEXT;
      `
    },
    {
      name: '012_suppliers_and_customers',
      query: `
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          name TEXT NOT NULL,
          contact_name TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          nif TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );

        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          nif TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );

        -- Refactor categories to a dedicated table
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );

        -- Link products to categories and suppliers
        ALTER TABLE products RENAME COLUMN category TO category_id;
        ALTER TABLE products ADD COLUMN supplier_id TEXT;
      `
    },
    {
      name: '013_orders_and_invoicing',
      query: `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          number TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          total_amount REAL NOT NULL DEFAULT 0,
          discount REAL DEFAULT 0,
          tax_amount REAL DEFAULT 0,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          tax_rate REAL DEFAULT 0,
          total REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          order_id TEXT,
          customer_id TEXT NOT NULL,
          number TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'invoice',
          status TEXT NOT NULL DEFAULT 'issued',
          total_amount REAL NOT NULL,
          due_date TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        );
      `
    },
    {
      name: '014_financials',
      query: `
        CREATE TABLE IF NOT EXISTS financial_transactions (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          type TEXT NOT NULL, -- 'income' | 'expense'
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          related_type TEXT, -- 'order' | 'invoice' | 'other'
          related_id TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );
      `
    },
    {
      name: '015_audit_indices',
      query: `
        CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
        CREATE INDEX IF NOT EXISTS idx_movements_company ON movements(company_id);
        CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
        CREATE INDEX IF NOT EXISTS idx_financials_company ON financial_transactions(company_id);
      `
    },
    {
      name: '016_scan_logs',
      query: `
        CREATE TABLE IF NOT EXISTS scan_logs (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          barcode TEXT NOT NULL,
          product_id TEXT, -- NULL if product not found
          status TEXT NOT NULL, -- 'success' | 'not_found'
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_scan_logs_company ON scan_logs(company_id);
        CREATE INDEX IF NOT EXISTS idx_scan_logs_created ON scan_logs(created_at);
      `
    },
    {
      name: '017_order_customer_name',
      query: `
        ALTER TABLE orders ADD COLUMN customer_name TEXT;
        UPDATE orders SET customer_name = 'Cliente Avulso' WHERE customer_name IS NULL;
      `
    },
    {
      name: '018_product_expiry',
      query: `
        ALTER TABLE products ADD COLUMN expiry_date TEXT;
      `
    }
  ]

  for (const migration of migrations) {
    const executed = db.getFirstSync<{ id: number }>(
      'SELECT id FROM migrations WHERE name = ?', 
      [migration.name]
    )

    if (!executed) {
      db.execSync(migration.query)
      db.runSync(
        'INSERT INTO migrations (name) VALUES (?)', 
        [migration.name]
      )
      console.log(`Migration ${migration.name} executed successfully.`)
    }
  }
}
