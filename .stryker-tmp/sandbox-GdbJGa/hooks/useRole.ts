/**
 * useRole — Role and permission hook for CulturePassAU.
 *
 * Returns role flags and loading state for the current user.
 *
 * @returns {
 *   isAdmin: boolean,
 *   isOrganizer: boolean,
 *   isLoading: boolean,
 *   hasMinRole: (role: string) => boolean,
 * }
 */
// @ts-nocheck

import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/shared/schema';

const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  organizer: 1,
  business: 1,
  sponsor: 1,
  cityAdmin: 2,
  moderator: 3,
  admin: 4,
  platformAdmin: 4,
  superAdmin: 5,
};

const SUPER_ADMIN_IDS = ['1VLiq1SEUzWNM7J2XScWn3UbFI52'];

/**
 * Role-aware hook.
 *
 * Usage:
 *   const { isOrganizer, isAdmin, role } = useRole();
 *   if (!isOrganizer) return <AccessDenied />;
 */
export function useRole() {
  const { user, isAuthenticated, isLoading, isRestoring } = useAuth();
  
  // Set role based on hardcoded ID list or existing user role
  let role: UserRole = (user?.role as UserRole) ?? 'user';
  if (user?.id && SUPER_ADMIN_IDS.includes(user.id)) {
    role = 'superAdmin';
  }

  return {
    role,
    isAuthenticated,
    isLoading: isLoading || isRestoring,
    /** rank >= organizer */
    isOrganizer: isAuthenticated && ROLE_RANK[role] >= ROLE_RANK['organizer'],
    /** rank >= cityAdmin */
    isCityAdmin: isAuthenticated && ROLE_RANK[role] >= ROLE_RANK['cityAdmin'],
    /** rank >= moderator */
    isModerator: isAuthenticated && ROLE_RANK[role] >= ROLE_RANK['moderator'],
    /** rank >= admin */
    isAdmin: isAuthenticated && ROLE_RANK[role] >= ROLE_RANK['admin'],
    /** exact super admin check */
    isSuperAdmin: isAuthenticated && ROLE_RANK[role] >= ROLE_RANK['superAdmin'],
    /** exact role match — use for specific roles like 'business' */
    hasRole: (...roles: UserRole[]) => isAuthenticated && roles.includes(role),
    /** rank comparison — use for "at least" checks */
    hasMinRole: (min: UserRole) => isAuthenticated && ROLE_RANK[role] >= ROLE_RANK[min],
  };
}
