import { UserRole } from '@/types'

export type Permission =
  | 'create_products' | 'edit_products' | 'delete_products'
  | 'view_reports'    | 'create_notes'  | 'manage_movements'
  | 'manage_users'    | 'system_settings' | 'view_history' | 'manage_backup'
  | 'manage_all_companies' | 'switch_company'

const PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'create_products', 'edit_products', 'delete_products',
    'view_reports', 'create_notes', 'manage_movements',
    'manage_users', 'system_settings', 'view_history', 'manage_backup',
    'manage_all_companies', 'switch_company'
  ],
  admin: [
    'create_products', 'edit_products', 'delete_products',
    'view_reports', 'create_notes', 'manage_movements',
    'manage_users', 'system_settings', 'view_history', 'manage_backup'
  ],
  manager: [
    'create_products', 'edit_products', 'view_reports',
    'create_notes', 'manage_movements', 'view_history', 'manage_backup'
  ],
  operator: ['create_products', 'edit_products', 'create_notes', 'manage_movements'],
  vendedor: ['create_products', 'edit_products', 'create_notes', 'manage_movements'],
  contador: ['view_reports', 'view_history'],
  viewer:   ['view_reports'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Throws if the given role does not have the required permission.
 * Use at the service layer to enforce RBAC beyond the UI.
 */
export function assertPermission(role: UserRole | undefined | null, permission: Permission): void {
  if (!role || !hasPermission(role, permission)) {
    throw new Error(`Sem permissão para: ${permission}`)
  }
}
