---
description: # Verificar e Corrigir Sincronização  ## Descrição Audita e corrige o sistema de sincronização SQLite → Supabase.
---

# Check & Fix Sync System

## Description
Audits and fixes the SQLite → Supabase sync system.

## Usage: `/check-sync`

## Steps

### 1. Check sync_queue table
Verify migration has all required fields per @../rules/04-sync.md

### 2. Check addToSyncQueue
Verify it correctly records `table_name`, `action`, and `data` (JSON)

### 3. Check syncData function
Verify it:
- Fetches only `synced = 0` records
- Handles errors per record without stopping all
- Increments `retry_count`
- Stops after 3 failed retries
- Marks as `synced = 1` on success

### 4. Check network listener
Verify the NetInfo listener is initialized at app startup and triggers `syncData()` on connect

### 5. Check all repositories
For each file in `src/repositories/`, verify `create`, `update`, and `delete` call `addToSyncQueue`

### 6. Check sync status screen
Verify `src/features/sync/` has a screen showing:
- Last sync timestamp
- Number of pending records
- Manual sync button
- Error log for failed records

### 7. Report
List all issues found with suggested fixes