'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { EmployeeSidebar } from './EmployeeSidebar';
import { EmployeeTopbar } from './EmployeeTopbar';
import { AssignTaskModal } from '@/modules/employee/team-tasks/components/AssignTaskModal';
import { useRole } from '@/hooks/useRole';
import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';

// Dynamically import CallProvider with SSR disabled.
// The Agora SDK accesses `window` at module load time, so it cannot be
// included in the server-side bundle.
const CallProvider = dynamic(
  () => import('@/modules/calls/components/CallProvider').then((m) => m.CallProvider),
  { ssr: false }
);

interface EmployeeShellProps {
  children: ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'taskflow:sidebar:collapsed';

export function EmployeeShell({ children }: EmployeeShellProps) {
  const { isTeamLeader } = useRole();
  const queryClient = useQueryClient();
  const departmentId = useAuthStore((s) => s.user?.departmentId);

  // Connect socket on mount — needed for chat realtime + call signaling
  useSocket();

  // Refresh team & assignable-user lists the moment an admin creates a user
  // in this department, so My Team and the Assign Task picker stay in sync
  // without a page reload.
  const refreshDepartmentMembers = useCallback(
    (data: { user?: { departmentId?: number | null } }) => {
      const incomingDeptId = data?.user?.departmentId ?? null;
      if (incomingDeptId && departmentId && incomingDeptId === departmentId) {
        queryClient.invalidateQueries({ queryKey: ['department-members', departmentId] });
      }
    },
    [queryClient, departmentId]
  );
  useSocketEvent<{ user?: { departmentId?: number | null } }>('user:created', refreshDepartmentMembers);

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1') setCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen flex">
      <EmployeeSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-[margin] duration-200',
          collapsed ? 'ml-16' : 'ml-16 md:ml-52 lg:ml-60'
        )}
      >
        <EmployeeTopbar />
        <main className="flex-1 px-3 py-4 sm:px-8 sm:py-7 overflow-y-auto">{children}</main>
      </div>
      <AssignTaskModal />

      {/* Mounts incoming call popup + active call window globally (browser only) */}
      <CallProvider />
    </div>
  );
}
