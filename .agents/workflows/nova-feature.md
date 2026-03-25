---
description: ## Descrição Cria a estrutura completa de uma nova feature seguindo a arquitetura feature-based do projeto.
---

# Create New Feature

## Description
Creates the complete structure for a new feature following the feature-based architecture.

## Usage: `/nova-feature [name]`
## Example: `/nova-feature inventory`

## Steps

### 1. Create folder structure
Create inside `src/features/[name]/`:
- `components/`
- `services/`
- `hooks/`
- `store/`
- `types/`

### 2. Create types
Call skill @../skills/typescript-types.md to generate `src/features/[name]/types/index.ts`

### 3. Create migration
Call skill @../skills/sqlite-migration.md to create the table migration for this feature

### 4. Create repository
Create `src/repositories/[name]Repository.ts` with:
- `getAll()` — fetch from SQLite
- `getById(id)` — fetch by id
- `create(data)` — insert into SQLite + addToSyncQueue
- `update(id, data)` — update SQLite + addToSyncQueue
- `delete(id)` — soft delete SQLite + addToSyncQueue

### 5. Create service
Create `src/features/[name]/services/[name]Service.ts` using the repository. Apply permission checks per @../rules/03-permissions.md. Log all mutations to history table.

### 6. Create hook
Create `src/features/[name]/hooks/use[Name].ts` exposing state and actions to UI

### 7. Create store (if needed)
Create `src/features/[name]/store/[name]Store.ts` for global state

### 8. Write tests
Call skill @../skills/tests.md to generate tests for the service and hook

### 9. Confirm
List all created files and ask if anything needs adjustment