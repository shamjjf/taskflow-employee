'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, Avatar, Badge } from '@/components/ui';
import { StatCard } from '@/components/shared';
import {
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { teamTasksService } from '@/modules/employee/team-tasks/services/teamTasksService';
import { normalizeTask } from '@/lib/normalizers';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { ApiResponse, TaskStatus, TaskPriority } from '@/types';

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

const statusLabel: Record<TaskStatus, string> = {
  assigned: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
  overdue: 'Overdue',
};

const statusBadge: Record<TaskStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  assigned: 'neutral',
  in_progress: 'info',
  in_review: 'warning',
  completed: 'success',
  overdue: 'danger',
};

const priorityBadge: Record<TaskPriority, 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

interface MemberPerformanceDetailProps {
  memberId: number;
}

export function MemberPerformanceDetail({ memberId }: MemberPerformanceDetailProps) {
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

  const member = (members || []).find((m) => m.id === memberId);

  const { stats, memberTasks } = useMemo(() => {
    const normalized = (tasks || []).map(normalizeTask);
    const mine = normalized
      .filter((t) => t.assignees.some((a) => a.userId === memberId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = mine.length;
    const completed = mine.filter((t) => t.status === 'completed').length;
    const inProgress = mine.filter((t) => t.status === 'in_progress').length;
    const inReview = mine.filter((t) => t.status === 'in_review').length;
    const assigned = mine.filter((t) => t.status === 'assigned').length;
    const overdue = mine.filter((t) => t.status === 'overdue').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      stats: { total, completed, inProgress, inReview, assigned, overdue, completionRate },
      memberTasks: mine,
    };
  }, [tasks, memberId]);

  const isLoading = membersLoading || tasksLoading;

  if (isLoading) {
    return <div className="text-center py-12 text-[#71717a]">Loading performance...</div>;
  }

  if (!member) {
    return (
      <Card>
        <CardBody>
          <div className="py-8 text-center">
            <div className="text-sm font-medium mb-1">Member not found</div>
            <div className="text-[12.5px] text-[#71717a] mb-4">
              This person isn&apos;t in your department, or no longer exists.
            </div>
            <Link
              href="/team/performance"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-primary hover:underline"
            >
              <ArrowLeft size={12} /> Back to team performance
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <CardBody className="py-4 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar initials={getInitials(member.name)} color={colorForId(member.id)} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[16px] sm:text-[17px] font-semibold truncate">
                  {member.name}
                </span>
                <Badge variant={member.status === 'active' ? 'success' : 'neutral'}>
                  {member.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="text-[12.5px] text-[#71717a] truncate">
                {member.designation ? `${member.designation} · ` : ''}
                {member.email}
              </div>
              {member.lastLoginAt && (
                <div className="text-[11.5px] text-[#a1a1aa] mt-0.5">
                  Active {formatRelativeTime(member.lastLoginAt)}
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider">
                Completion
              </div>
              <div className="text-[24px] sm:text-[28px] font-semibold leading-none mt-1">
                {stats.completionRate}%
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4">
        <StatCard label="Total Tasks" value={stats.total} icon={ClipboardList} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Play} />
        <StatCard label="In Review" value={stats.inReview} icon={Eye} />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          changeDirection={stats.overdue > 0 ? 'down' : 'up'}
          change={stats.overdue > 0 ? 'Behind schedule' : 'On track'}
        />
      </div>

      <Card>
        <CardHeader
          title="Workload Breakdown"
          subtitle="Distribution of this member's current tasks"
          action={<TrendingUp size={14} className="text-[#71717a]" />}
        />
        <CardBody>
          {stats.total === 0 ? (
            <div className="py-6 text-center text-[12.5px] text-[#71717a]">
              No tasks assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {(
                [
                  ['Completed', stats.completed, 'bg-success'],
                  ['In Progress', stats.inProgress, 'bg-primary'],
                  ['In Review', stats.inReview, 'bg-warning'],
                  ['To Do', stats.assigned, 'bg-[#c4b5fd]'],
                  ['Overdue', stats.overdue, 'bg-danger'],
                ] as const
              ).map(([label, value, bar]) => {
                const pct = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-24 sm:w-28 text-[12px] text-[#71717a] shrink-0">{label}</div>
                    <div className="flex-1 h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 sm:w-20 text-right text-[12px]">
                      <span className="font-semibold">{value}</span>
                      <span className="text-[#71717a] ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Recent Tasks"
          subtitle={`Latest ${Math.min(memberTasks.length, 10)} tasks assigned to ${member.name.split(' ')[0]}`}
        />
        <div>
          {memberTasks.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#71717a] text-sm">
              No tasks assigned yet.
            </div>
          ) : (
            memberTasks.slice(0, 10).map((t, i, arr) => (
              <Link
                key={t.id}
                href={`/task/${t.id}`}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-surface-muted transition-colors ${
                  i < arr.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium truncate">{t.title}</div>
                  <div className="text-[11.5px] text-[#71717a] mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{t.deadlineLabel}</span>
                    <span>·</span>
                    <Badge variant={priorityBadge[t.priority]} withDot={false}>
                      {t.priority}
                    </Badge>
                  </div>
                </div>
                <Badge variant={statusBadge[t.status]}>{statusLabel[t.status]}</Badge>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
