'use client';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { EmployeeDashboardStats } from '@/modules/employee/dashboard/components/EmployeeDashboardStats';
import { UpcomingDeadlines } from '@/modules/employee/dashboard/components/UpcomingDeadlines';
import { WeeklyProgress } from '@/modules/employee/dashboard/components/WeeklyProgress';
import {
  TLDashboardStats,
  TLPendingApprovals,
} from '@/modules/employee/dashboard/components/TLDashboardWidgets';
import { useAuthStore } from '@/store/authStore';
import { useRole } from '@/hooks/useRole';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { FilePlus, Plus } from 'lucide-react';

export default function EmployeeDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isTeamLeader } = useRole();
  const router = useRouter();
  const openTaskModal = useUIStore((s) => s.openTaskModal);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Hi ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle={
          isTeamLeader
            ? "Here's your team workspace for today."
            : "Here's your workspace for today."
        }
        action={
          isTeamLeader ? (
            // <Button variant="primary" onClick={openTaskModal}>
            //   <Plus size={14} strokeWidth={2.5} />
            //   Assign Task
            // </Button>
            <></>
          ) : (
            <Button variant="primary" onClick={() => router.push('/submit-report')}>
              <FilePlus size={14} />
              Submit Daily Report
            </Button>
          )
        }
      />

      {isTeamLeader && (
        <>
          <div className="mb-2 text-[13px] font-medium text-[#71717a] uppercase tracking-wider">
            Team Overview
          </div>
          <TLDashboardStats />
        </>
      )}

      <div className="mb-2 text-[13px] font-medium text-[#71717a] uppercase tracking-wider">
        My Work
      </div>
      <EmployeeDashboardStats />

      <div className="grid grid-cols-[1fr_1fr] gap-5">
        {isTeamLeader ? <TLPendingApprovals /> : <UpcomingDeadlines />}
        <WeeklyProgress />
      </div>

      {isTeamLeader && (
        <div className="mt-5">
          <UpcomingDeadlines />
        </div>
      )}
    </div>
  );
}
