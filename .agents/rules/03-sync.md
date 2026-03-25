---
trigger: always_on
description: Descrição: Aplicar quando o agente trabalhar em sincronização, SQLite, Supabase ou fila de sync
---

# Offline-First Sync

## Activation: Model Decision
## Description: Apply when working on sync, SQLite writes, or any data mutation

## Core Principle
Always save to SQLite first. Supabase sync happens in the background when online.

## Sync Flow
```
User action → SQLite (immediate) → sync_queue → NetInfo detects online → syncData() → Supabase → synced = 1
```

## sync_queue Table
```sql
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'INSERT' | 'UPDATE' | 'DELETE'
  data TEXT NOT NULL,             -- JSON stringified
  synced INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Sync Rules
- Max 3 retries per record — skip after that
- Conflicts resolved by `updated_at` (last-write-wins)
- Never delete from sync_queue — mark as `synced = 1`
- Sync runs only when `isConnected === true`
- Always wrap sync in try/catch per record (one failure doesn't stop all)

## addToSyncQueue Pattern
```typescript
addToSyncQueue(tableName: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: object): void
```

## Every Repository Must
Call `addToSyncQueue` after every `create`, `update`, and `delete` operation on SQLite.