---
description: ### 2. Criar estrutura de pastas
---

# Setup Initial Project

## Description
Sets up the full project from scratch with the complete professional stack.

## Usage: `/setup`

## Steps

### 1. Verify dependencies
Check `package.json` for: expo, expo-router, expo-sqlite, @supabase/supabase-js, zustand, nativewind, tailwindcss, @react-native-community/netinfo, expo-barcode-scanner, expo-notifications, expo-image-picker

### 2. Create full folder structure
Create all folders per @../rules/02-architecture.md

### 3. Create Supabase client
Create `src/services/supabase.ts` with env-based config

### 4. Create SQLite init
Create `src/database/sqlite.ts` with DB initialization and migrations runner

### 5. Create sync_queue migration
Create `src/database/migrations/001_sync_queue.sql` per @../rules/04-sync.md

### 6. Create products migration
Create `src/database/migrations/002_products.sql` with all fields from @../rules/05-products.md

### 7. Create movements migration
Create `src/database/migrations/003_movements.sql`

### 8. Create users migration
Create `src/database/migrations/004_users.sql` with role field

### 9. Create history migration
Create `src/database/migrations/005_history.sql`

### 10. Create sync utilities
Create `src/utils/syncData.ts` with `addToSyncQueue` and `syncData`
Create `src/utils/networkListener.ts` with NetInfo listener

### 11. Create auth store
Create `src/features/auth/store/authStore.ts` with user + role

### 12. Create permissions utility
Create `src/utils/permissions.ts` with `hasPermission(role, permission)` function and full matrix from @../rules/03-permissions.md

### 13. Create base UI components
Create all components in `src/components/ui/` per @../rules/06-ui.md

### 14. Configure Expo Router
Create `app/_layout.tsx` with session check and route protection
Create `app/(auth)/` for login/register screens
Create `app/(app)/` for protected screens with tab navigation

### 15. Summary
List all created files and suggest next step: `/nova-feature auth`