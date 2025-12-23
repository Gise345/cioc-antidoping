/**
 * useAdmin Hook
 * Custom hook for checking admin permissions
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminPermissions {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageAthletes: boolean;
  canManageSettings: boolean;
}

interface AuthState {
  userProfile: {
    role?: 'athlete' | 'admin' | 'super_admin';
  } | null;
}

interface RootState {
  auth: AuthState;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to check admin permissions based on user role
 *
 * Roles and permissions:
 * - super_admin: All permissions (manage athletes, manage settings)
 * - admin: Can manage athletes, cannot manage settings
 * - athlete: No admin permissions
 *
 * @returns AdminPermissions object
 */
export const useAdmin = (): AdminPermissions => {
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);

  const permissions = useMemo(() => {
    const role = userProfile?.role;

    switch (role) {
      case 'super_admin':
        return {
          isAdmin: true,
          isSuperAdmin: true,
          canManageAthletes: true,
          canManageSettings: true,
        };

      case 'admin':
        return {
          isAdmin: true,
          isSuperAdmin: false,
          canManageAthletes: true,
          canManageSettings: false,
        };

      case 'athlete':
      default:
        return {
          isAdmin: false,
          isSuperAdmin: false,
          canManageAthletes: false,
          canManageSettings: false,
        };
    }
  }, [userProfile?.role]);

  return permissions;
};

/**
 * Hook to check if current user is an admin (any level)
 */
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useAdmin();
  return isAdmin;
};

/**
 * Hook to check if current user is a super admin
 */
export const useIsSuperAdmin = (): boolean => {
  const { isSuperAdmin } = useAdmin();
  return isSuperAdmin;
};

export default useAdmin;
