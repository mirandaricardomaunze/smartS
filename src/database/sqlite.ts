import * as SQLite from 'expo-sqlite'
import { logger } from '@/utils/logger'

export const db = SQLite.openDatabaseSync('stockapp.db')

export async function initDatabase() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
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
        CREATE TABLE IF NOT EXISTS stock_movements (
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
        CREATE INDEX IF NOT EXISTS idx_stock_movements_synced ON stock_movements(synced);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
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
        ALTER TABLE stock_movements ADD COLUMN company_id TEXT;
        ALTER TABLE users RENAME COLUMN company TO company_id;
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
        CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);
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
    },
    {
      name: '019_notifications_sync_tenancy',
      query: `
        ALTER TABLE notifications ADD COLUMN company_id TEXT;
        ALTER TABLE sync_queue ADD COLUMN company_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
      `
    },
    {
      name: '020_hr_module',
      query: `
        CREATE TABLE IF NOT EXISTS departments (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );

        CREATE TABLE IF NOT EXISTS positions (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          department_id TEXT NOT NULL,
          title TEXT NOT NULL,
          base_salary REAL DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (department_id) REFERENCES departments(id)
        );

        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          position_id TEXT,
          name TEXT NOT NULL,
          bi_number TEXT,
          nit TEXT,
          address TEXT,
          contacts TEXT, -- JSON string
          photo_url TEXT,
          employment_type TEXT DEFAULT 'permanent', -- 'permanent' | 'fixed-term' | 'probation'
          status TEXT DEFAULT 'active', -- 'active' | 'suspended' | 'terminated'
          contract_start_date TEXT,
          contract_end_date TEXT,
          emergency_contact TEXT, -- JSON string
          bank_details TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (position_id) REFERENCES positions(id)
        );

        CREATE TABLE IF NOT EXISTS attendance (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          employee_id TEXT NOT NULL,
          date TEXT NOT NULL, -- YYYY-MM-DD
          clock_in TEXT,
          clock_out TEXT,
          breaks TEXT, -- JSON array of ranges
          status TEXT DEFAULT 'present', -- 'present' | 'absent' | 'late' | 'justified'
          justification TEXT,
          total_minutes INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        );

        CREATE TABLE IF NOT EXISTS leaves (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          employee_id TEXT NOT NULL,
          type TEXT NOT NULL, -- 'vacation' | 'sick' | 'maternity' | 'paternity' | 'other'
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
          reason TEXT,
          approved_by TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        );

        CREATE TABLE IF NOT EXISTS payroll (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          employee_id TEXT NOT NULL,
          period_month INTEGER NOT NULL,
          period_year INTEGER NOT NULL,
          base_salary REAL NOT NULL,
          overtime_pay REAL DEFAULT 0,
          bonus REAL DEFAULT 0,
          subsidy_meal REAL DEFAULT 0,
          subsidy_transport REAL DEFAULT 0,
          deduction_inss REAL DEFAULT 0,
          deduction_irps REAL DEFAULT 0,
          deduction_other REAL DEFAULT 0,
          net_salary REAL NOT NULL,
          status TEXT DEFAULT 'draft', -- 'draft' | 'paid' | 'cancelled'
          payment_date TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id),
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        );

        CREATE INDEX IF NOT EXISTS idx_hr_employees_company ON employees(company_id);
        CREATE INDEX IF NOT EXISTS idx_hr_attendance_date ON attendance(date);
        CREATE INDEX IF NOT EXISTS idx_hr_attendance_employee ON attendance(employee_id);
        CREATE INDEX IF NOT EXISTS idx_hr_payroll_period ON payroll(period_year, period_month);
      `
    },
    // Migrations 021a/b/c removed — columns 'breaks', 'status', 'total_minutes'
    // are already created in migration 020_hr_module. The migration runner marks
    // them as executed via the duplicate-column-name handler.
    {
      name: '021_attendance_breaks',
      query: 'SELECT 1; -- no-op: column already in 020'
    },
    {
      name: '021b_attendance_status',
      query: 'SELECT 1; -- no-op: column already in 020'
    },
    {
      name: '021c_attendance_minutes',
      query: 'SELECT 1; -- no-op: column already in 020'
    },
    {
      name: '022_emp_nacionality',
      query: 'ALTER TABLE employees ADD COLUMN nacionality TEXT;'
    },
    {
      name: '022b_emp_civil',
      query: 'ALTER TABLE employees ADD COLUMN civil_status TEXT;'
    },
    {
      name: '022c_emp_bank',
      query: 'ALTER TABLE employees ADD COLUMN bank_name TEXT;'
    },
    {
      name: '022d_emp_acc',
      query: 'ALTER TABLE employees ADD COLUMN bank_account TEXT;'
    },
    {
      name: '022e_emp_nib',
      query: 'ALTER TABLE employees ADD COLUMN nib TEXT;'
    },
    {
      name: '023_add_product_reference',
      query: 'ALTER TABLE products ADD COLUMN reference TEXT;'
    },
    {
      name: '024_subscriptions',
      query: `
        CREATE TABLE IF NOT EXISTS subscriptions (
          company_id TEXT PRIMARY KEY,
          trial_started_at TEXT,
          trial_ends_at TEXT,
          plan TEXT NOT NULL DEFAULT 'trial',
          trial_expired INTEGER DEFAULT 0,
          onboarding_completed INTEGER DEFAULT 0,
          updated_at TEXT DEFAULT (datetime('now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );
        CREATE INDEX IF NOT EXISTS idx_subscriptions_synced ON subscriptions(synced);
      `
    },
    {
      name: '025_rename_movements_to_stock_movements',
      query: `
        -- Idempotent: only runs if 'movements' table still exists.
        -- On new DBs, stock_movements was created directly by migration 003,
        -- so this is a no-op. The indexes are created with IF NOT EXISTS.
        DROP INDEX IF EXISTS idx_movements_synced;
        DROP INDEX IF EXISTS idx_movements_product;
        DROP INDEX IF EXISTS idx_movements_company;
        CREATE INDEX IF NOT EXISTS idx_stock_movements_synced ON stock_movements(synced);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);
      `
    },
    {
      name: '026_stock_movements_upd',
      query: "ALTER TABLE stock_movements ADD COLUMN updated_at TEXT;"
    },
    {
      name: '027_history_upd',
      query: "ALTER TABLE history ADD COLUMN updated_at TEXT;"
    },
    {
      name: '028_notes_upd',
      query: "ALTER TABLE notes ADD COLUMN updated_at TEXT;"
    },
    {
      name: '029_companies_upd',
      query: "ALTER TABLE companies ADD COLUMN updated_at TEXT;"
    },
    {
      name: '030_suppliers_upd',
      query: "ALTER TABLE suppliers ADD COLUMN updated_at TEXT;"
    },
    {
      name: '031_customers_upd',
      query: "ALTER TABLE customers ADD COLUMN updated_at TEXT;"
    },
    {
      name: '032_categories_upd',
      query: "ALTER TABLE categories ADD COLUMN updated_at TEXT;"
    },
    {
      name: '033_invoices_upd',
      query: "ALTER TABLE invoices ADD COLUMN updated_at TEXT;"
    },
    {
      name: '034_financial_upd',
      query: "ALTER TABLE financial_transactions ADD COLUMN updated_at TEXT;"
    },
    {
      name: '035_fill_updated_at',
      query: `
        UPDATE stock_movements SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE history SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE notes SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE companies SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE suppliers SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE customers SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE categories SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE invoices SET updated_at = datetime('now') WHERE updated_at IS NULL;
        UPDATE financial_transactions SET updated_at = datetime('now') WHERE updated_at IS NULL;
      `
    }
  ]

  for (const migration of migrations) {
    const executed = db.getFirstSync<{ id: number }>(
      'SELECT id FROM migrations WHERE name = ?', 
      [migration.name]
    )

    if (!executed) {
      try {
        await db.execAsync(migration.query)
        db.runSync(
          'INSERT INTO migrations (name) VALUES (?)', 
          [migration.name]
        )
        logger.debug(`Migration ${migration.name} executed successfully.`)
      } catch (e: unknown) {
        const errorMessage = (e instanceof Error ? e.message : String(e)).toLowerCase()
        // If the error is 'duplicate column name' or 'already exists', we can mark it as executed
        if (
          errorMessage.includes('duplicate column') || 
          errorMessage.includes('already exists') ||
          errorMessage.includes('no such column') // Case where we try to UPDATE a column that doesn't exist
        ) {
          db.runSync(
            'INSERT INTO migrations (name) VALUES (?)', 
            [migration.name]
          )
          logger.debug(`Migration ${migration.name} already applied or handled.`)
        } else if (errorMessage.includes('no such table')) {
          logger.warn(`Migration ${migration.name} skipped: table does not exist.`)
        } else {
          console.error(`Migration ${migration.name} failed:`, errorMessage)
        }
      }
    }
  }
}
