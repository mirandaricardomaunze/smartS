import React, { useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/utils/permissions';
import { router } from 'expo-router';
import Loading from '@/components/ui/Loading';

interface RoleGuardProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}

/**
 * Higher-order component to protect screens based on permissions.
 * Redirects to /no-access if the user lacks the required permission.
 */
export default function RoleGuard({ children, permission, fallback }: RoleGuardProps) {
  const { can, role } = usePermissions();

  useEffect(() => {
    if (role && !can(permission)) {
      router.replace('/(app)/no-access');
    }
  }, [role, permission, can]);

  if (!role) return <Loading />;

  if (!can(permission)) {
    return fallback || <Loading />;
  }

  return <>{children}</>;
}
