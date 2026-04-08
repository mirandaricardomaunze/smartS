-- Migration: Rename movements to stock_movements
-- Description: Standardize table names for Supabase compatibility

PRAGMA foreign_keys=OFF;

-- 1. Rename the existing table
ALTER TABLE movements RENAME TO stock_movements;

-- 2. Drop old indices and recreate them with the new name
DROP INDEX IF EXISTS idx_movements_synced;
DROP INDEX IF EXISTS idx_movements_product;
DROP INDEX IF EXISTS idx_movements_company;

CREATE INDEX IF NOT EXISTS idx_stock_movements_synced ON stock_movements(synced);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);

PRAGMA foreign_keys=ON;
