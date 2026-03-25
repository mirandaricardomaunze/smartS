---
name: Create SQLite Migration
description: Rules and templates for creating or altering database tables in SQLite.
---
# Skill: Create SQLite Migration

## Naming Convention
`src/database/migrations/[NNN]_[description].sql`
Example: `006_create_expiry_table.sql`

## Required Columns (every table)
```sql
id TEXT PRIMARY KEY,                         -- UUID
created_at TEXT DEFAULT (datetime('now')),
updated_at TEXT DEFAULT (datetime('now')),
synced INTEGER DEFAULT 0                     -- 0=pending, 1=synced
```

## Output Template
```sql
-- Migration [NNN]: [description]
-- Created: [date]

CREATE TABLE IF NOT EXISTS [table_name] (
  id TEXT PRIMARY KEY,
  -- feature-specific columns here
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0
);

-- Index for sync queries
CREATE INDEX IF NOT EXISTS idx_[table_name]_synced ON [table_name](synced);
```

## Type Rules
- `TEXT` → UUIDs, dates, strings, enums
- `INTEGER` → booleans (0/1), counts, quantities
- `REAL` → prices, decimals
- Never use `AUTOINCREMENT` for id — use UUID as TEXT

## After Creating
Register the migration in `src/database/sqlite.ts` inside the migrations runner array.
