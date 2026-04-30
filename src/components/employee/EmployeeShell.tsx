'use client';

import { ReactNode } from 'react';
import { EmployeeSidebar } from './EmployeeSidebar';
import { EmployeeTopbar } from './EmployeeTopbar';
import { AssignTaskModal } from '@/modules/employee/team-tasks/components/AssignTaskModal';
import { useRole } from '@/hooks/useRole';
import { useSocket } from '@/hooks/useSocket';
import { CallProvider } from '@/modules/calls/components/CallProvider';

interface EmployeeShellProps {
  children: ReactNode;
}

export function EmployeeShell({ children }: EmployeeShellProps) {
  const { isTeamLeader } = useRole();

  // Connect socket on mount — needed for chat realtime + call signaling
  useSocket();

  return (
    <div className="min-h-screen flex">
      <EmployeeSidebar />
      <div className="flex-1 ml-60 flex flex-col min-w-0">
        <EmployeeTopbar />
        <main className="flex-1 px-8 py-7 overflow-y-auto">{children}</main>
      </div>
      {isTeamLeader && <AssignTaskModal />}

      {/* Mounts incoming call popup + active call window globally */}
      <CallProvider />
    </div>
  );
}
