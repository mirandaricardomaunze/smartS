---
name: Generate TypeScript Types
description: Rules and templates for creating types, interfaces, or enums for a feature.
---
# Skill: Generate TypeScript Types

## Rules
- `interface` for objects, `type` for unions
- `readonly` for immutable fields (id, created_at)
- No `any` — use `unknown` if uncertain
- Comments in English
- Export all types
- Save to: `src/features/[feature]/types/index.ts`

## Output Template

### Entity (mirrors DB table)
```typescript
// [EntityName] — represents a [description]
export interface [EntityName] {
  readonly id: string
  // feature-specific fields
  readonly created_at: string
  updated_at: string
  synced: 0 | 1
}
```

### DTOs
```typescript
// [EntityName]CreateDTO — payload for creating a new [EntityName]
export type [EntityName]CreateDTO = Omit<[EntityName], 'id' | 'created_at' | 'updated_at' | 'synced'>

// [EntityName]UpdateDTO — payload for updating an existing [EntityName]
export type [EntityName]UpdateDTO = Partial<[EntityName]CreateDTO>
```

### Enums
```typescript
// [EnumName] — possible values for [field]
export enum [EnumName] {
  VALUE_ONE = 'VALUE_ONE',
  VALUE_TWO = 'VALUE_TWO',
}
```

## App-Wide Enums to Reuse
```typescript
type UserRole = 'admin' | 'manager' | 'operator' | 'viewer'
type MovementType = 'entry' | 'exit' | 'transfer' | 'adjustment'
type SyncStatus = 0 | 1
```
