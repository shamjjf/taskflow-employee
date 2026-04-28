'use client';

import { useAuth } from '@/hooks/useAuth';
import { EmployeeShell } from '@/components/employee';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[#71717a]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <EmployeeShell>{children}</EmployeeShell>;
}
