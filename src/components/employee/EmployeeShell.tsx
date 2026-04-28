'use client';

import { ReactNode } from 'react';
import { EmployeeSidebar } from './EmployeeSidebar';
import { EmployeeTopbar } from './EmployeeTopbar';
import { AssignTaskModal } from '@/modules/employee/team-tasks/components/AssignTaskModal';
import { useRole } from '@/hooks/useRole';

interface EmployeeShellProps {
  children: ReactNode;
}

export function EmployeeShell({ children }: EmployeeShellProps) {
  const { isTeamLeader } = useRole();

  return (
    <div className="min-h-screen flex">
      <EmployeeSidebar />
      <div className="flex-1 ml-60 flex flex-col min-w-0">
        <EmployeeTopbar />
        <main className="flex-1 px-8 py-7 overflow-y-auto">{children}</main>
      </div>
      {isTeamLeader && <AssignTaskModal />}
    </div>
  );
}
