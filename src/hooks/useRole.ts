'use client';

import { useAuthStore } from '@/store/authStore';

export function useRole() {
  const user = useAuthStore((s) => s.user);
  return {
    isSuperAdmin: user?.role === 'super_admin',
    isTeamLeader: user?.role === 'team_leader',
    isEmployee: user?.role === 'employee',
    isTLOrAbove: user?.role === 'super_admin' || user?.role === 'team_leader',
    role: user?.role,
    user,
  };
}
