import { useAuthStore } from '@/features/auth/store/authStore'
import { hasPermission, Permission } from '@/utils/permissions'
import { useMemo } from 'react'

/**
 * Hook for easy permission checks in React components.
 * 
 * @example
 * const { can } = usePermissions()
 * if (can('manage_users')) { ... }
 */
export function usePermissions() {
  const user = useAuthStore(state => state.user)
  const role = user?.role

  const can = useMemo(() => (permission: Permission): boolean => {
    if (!role) return false
    return hasPermission(role, permission)
  }, [role])

  return { 
    can, 
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    isManager: role === 'manager',
    isOperator: role === 'operator' || role === 'vendedor'
  }
}
