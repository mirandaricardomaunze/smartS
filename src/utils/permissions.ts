import { UserRole } from '@/types'

type Permission =
  | 'create_products' | 'edit_products' | 'delete_products'
  | 'view_reports' | 'create_notes' | 'manage_movements'
  | 'manage_users' | 'system_settings' | 'view_history' | 'manage_backup'

const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'create_products', 'edit_products', 'delete_products',
    'view_reports', 'create_notes', 'manage_movements',
    'manage_users', 'system_settings', 'view_history', 'manage_backup'
  ],
  manager: [
    'create_products', 'edit_products', 'view_reports',
    'create_notes', 'manage_movements', 'view_history', 'manage_backup'
  ],
  operator: ['create_notes', 'manage_movements'],
  vendedor: ['create_notes', 'manage_movements'],
  contador: ['view_reports', 'view_history'],
  viewer: ['view_reports'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}
