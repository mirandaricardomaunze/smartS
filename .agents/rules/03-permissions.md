---
trigger: always_on
---

# User Roles & Permissions

## Activation: Model Decision
## Description: Apply when working on auth, users, permissions, or any feature that requires access control

## Roles
```typescript
type UserRole = 'admin' | 'manager' | 'operator' | 'viewer'
```

## Permission Matrix
| Permission           | Admin | Manager | Operator | Viewer |
|----------------------|-------|---------|----------|--------|
| create_products      | ✅    | ✅      | ❌       | ❌     |
| edit_products        | ✅    | ✅      | ❌       | ❌     |
| delete_products      | ✅    | ❌      | ❌       | ❌     |
| view_reports         | ✅    | ✅      | ❌       | ✅     |
| create_notes         | ✅    | ✅      | ✅       | ❌     |
| manage_movements     | ✅    | ✅      | ✅       | ❌     |
| manage_users         | ✅    | ❌      | ❌       | ❌     |
| system_settings      | ✅    | ❌      | ❌       | ❌     |
| view_history         | ✅    | ✅      | ❌       | ❌     |
| manage_backup        | ✅    | ✅      | ❌       | ❌     |

## Implementation Rules
- Always check permissions in the service layer, never just in the UI
- Use a `usePermissions()` hook to check access in components
- Hide UI elements the user cannot access (don't just disable them)
- Store role in Zustand `authStore` after login
- Role is saved in Supabase `users` table and synced to SQLite

## Permission Check Pattern
```typescript
// In service layer
if (!hasPermission(user.role, 'create_products')) {
  throw new Error('Unauthorized')
}
```