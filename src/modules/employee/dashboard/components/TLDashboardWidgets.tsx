'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardHeader, Avatar, Badge } from '@/components/ui';
import { StatCard } from '@/components/shared';
import { Users, FileCheck, CheckCircle, ClipboardList } from 'lucide-react';
import { teamTasksService } from '../../team-tasks/services/teamTasksService';
import { approvalService } from '../../approval/services/approvalService';
import { normalizeTask, normalizeReport } from '@/lib/normalizers';
import { formatRelativeTime } from '@/lib/utils';

export function TLDashboardStats() {
  const { data: tasks } = useQuery({
    queryKey: ['team-tasks'],
    queryFn: () => teamTasksService.list(),
  });

  const { data: pending } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => approvalService.listPending(),
  });

  const normalizedTasks = (tasks || []).map(normalizeTask);
  const teamSize = new Set(normalizedTasks.flatMap((t) => t.assignees.map((a) => a.userId))).size;
  const activeTasks = normalizedTasks.filter(
    (t) => t.status === 'assigned' || t.status === 'in_progress'
  ).length;
  const completedThisWeek = normalizedTasks.filter((t) => t.status === 'completed').length;
  const pendingCount = (pending || []).length;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard label="Team Size" value={teamSize} suffix="members" icon={Users} />
      <StatCard label="Active Team Tasks" value={activeTasks} icon={ClipboardList} />
      <StatCard
        label="Pending Approvals"
        value={pendingCount}
        icon={FileCheck}
        change={pendingCount > 0 ? 'Needs your review' : 'All caught up!'}
        changeDirection={pendingCount > 0 ? 'down' : 'up'}
      />
      <StatCard label="Team Completed" value={completedThisWeek} suffix="total" icon={CheckCircle} />
    </div>
  );
}

export function TLPendingApprovals() {
  const { data, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => approvalService.listPending(),
  });

  const pending = (data || []).map(normalizeReport).slice(0, 3);

  return (
    <Card>
      <CardHeader
        title="Reports Waiting for You"
        action={<Badge variant="warning">{pending.length} pending</Badge>}
      />
      <div>
        {isLoading ? (
          <div className="px-5 py-8 text-center text-[#71717a] text-sm">Loading...</div>
        ) : pending.length === 0 ? (
          <div className="px-5 py-8 text-center text-[#71717a] text-sm">No pending approvals 🎉</div>
        ) : (
          pending.map((r, i) => (
            <Link
              key={r.id}
              href="/approve-reports"
              className={`flex gap-3 px-5 py-3.5 hover:bg-surface-muted transition-colors ${
                i < pending.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Avatar initials={r.userInitials} color={r.userColor} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">
                  {r.userName} · {r.reportType === 'weekly' ? 'Weekly' : 'Daily'} Report
                </div>
                <div className="text-[12.5px] text-[#71717a] truncate">{r.description}</div>
                <div className="text-[11.5px] text-[#a1a1aa] mt-1">
                  {formatRelativeTime(r.createdAt)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}
