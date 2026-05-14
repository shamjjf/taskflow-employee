'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, Avatar, Badge } from '@/components/ui';
import { StatCard } from '@/components/shared';
import {
  Users,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { teamTasksService } from '@/modules/employee/team-tasks/services/teamTasksService';
import { normalizeTask } from '@/lib/normalizers';
import { getInitials } from '@/lib/utils';
import type { ApiResponse, TaskStatus } from '@/types';

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

interface DeptUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'team_leader' | 'employee';
  designation?: string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
}

interface MemberStats {
  user: DeptUser;
  total: number;
  completed: number;
  inProgress: number;
  inReview: number;
  overdue: number;
  assigned: number;
  completionRate: number;
}

function rateTone(rate: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (rate >= 75) return 'success';
  if (rate >= 50) return 'warning';
  if (rate > 0) return 'danger';
  return 'neutral';
}

export function TeamPerformanceOverview() {
  const currentUser = useAuthStore((s) => s.user);

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['department-members', currentUser?.departmentId],
    queryFn: async () => {
      if (!currentUser?.departmentId) return [];
      const res = await api.get<ApiResponse<DeptUser[]>>(
        `/departments/${currentUser.departmentId}/members`
      );
      return res.data;
    },
    enabled: !!currentUser?.departmentId,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['team-tasks'],
    queryFn: () => teamTasksService.list(),
  });

  const { memberStats, teamTotals } = useMemo(() => {
    const normalizedTasks = (tasks || []).map(normalizeTask);
    const employees = (members || []).filter((m) => m.role === 'employee');

    const statusByUser = new Map<number, TaskStatus[]>();
    for (const t of normalizedTasks) {
      for (const a of t.assignees) {
        const list = statusByUser.get(a.userId) || [];
        list.push(t.status);
        statusByUser.set(a.userId, list);
      }
    }

    const stats: MemberStats[] = employees.map((u) => {
      const statuses = statusByUser.get(u.id) || [];
      const total = statuses.length;
      const completed = statuses.filter((s) => s === 'completed').length;
      const inProgress = statuses.filter((s) => s === 'in_progress').length;
      const inReview = statuses.filter((s) => s === 'in_review').length;
      const overdue = statuses.filter((s) => s === 'overdue').length;
      const assigned = statuses.filter((s) => s === 'assigned').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { user: u, total, completed, inProgress, inReview, overdue, assigned, completionRate };
    });

    stats.sort((a, b) => b.completionRate - a.completionRate || b.completed - a.completed);

    const totals = stats.reduce(
      (acc, s) => {
        acc.total += s.total;
        acc.completed += s.completed;
        acc.inProgress += s.inProgress;
        acc.overdue += s.overdue;
        return acc;
      },
      { total: 0, completed: 0, inProgress: 0, overdue: 0 }
    );

    return { memberStats: stats, teamTotals: totals };
  }, [members, tasks]);

  const isLoading = membersLoading || tasksLoading;
  const teamRate =
    teamTotals.total > 0 ? Math.round((teamTotals.completed / teamTotals.total) * 100) : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          label="Team Members"
          value={memberStats.length}
          icon={Users}
          suffix="people"
        />
        <StatCard
          label="Completion Rate"
          value={`${teamRate}%`}
          icon={TrendingUp}
          change={`${teamTotals.completed} of ${teamTotals.total} completed`}
          changeDirection={teamRate >= 50 ? 'up' : 'down'}
        />
        <StatCard label="In Progress" value={teamTotals.inProgress} icon={ClipboardList} />
        <StatCard
          label="Overdue"
          value={teamTotals.overdue}
          icon={AlertCircle}
          changeDirection={teamTotals.overdue > 0 ? 'down' : 'up'}
          change={teamTotals.overdue > 0 ? 'Needs attention' : 'All on track'}
        />
      </div>

      <Card>
        <CardHeader
          title="Members"
          subtitle="Click a row to see detailed performance"
          action={
            <Badge variant="neutral" withDot={false}>
              {memberStats.length}
            </Badge>
          }
        />
        <div>
          {isLoading ? (
            <div className="px-5 py-10 text-center text-[#71717a] text-sm">Loading...</div>
          ) : memberStats.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#71717a] text-sm">
              No team members yet.
            </div>
          ) : (
            memberStats.map((s, i) => (
              <Link
                key={s.user.id}
                href={`/team/performance/${s.user.id}`}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-surface-muted transition-colors ${
                  i < memberStats.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <Avatar
                  initials={getInitials(s.user.name)}
                  color={colorForId(s.user.id)}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold truncate">{s.user.name}</span>
                    {s.user.designation && (
                      <span className="text-[11.5px] text-[#71717a]">{s.user.designation}</span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    <div className="h-1.5 bg-[#f4f4f5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${s.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-[#71717a] flex-wrap">
                    <span>{s.completed} completed</span>
                    <span>·</span>
                    <span>{s.inProgress} in progress</span>
                    {s.overdue > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-danger">{s.overdue} overdue</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={rateTone(s.completionRate)} withDot={false}>
                    {s.completionRate}%
                  </Badge>
                  <span className="text-[11px] text-[#a1a1aa]">{s.total} tasks</span>
                </div>
                <ChevronRight size={16} className="text-[#a1a1aa] shrink-0 hidden sm:block" />
              </Link>
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardBody>
          <div className="text-[12.5px] text-[#71717a] leading-relaxed">
            Performance is computed from tasks assigned to each member of your department. The
            completion rate is the share of their tasks marked completed. Click a member to see a
            breakdown of their work.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
