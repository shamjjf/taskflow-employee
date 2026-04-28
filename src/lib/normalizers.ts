import { getInitials } from './utils';
import type { Task, TaskPriority, TaskStatus, Report } from '@/types';

const assigneeColor = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

export { assigneeColor };

export function normalizeTask(raw: unknown): Task {
  const r = raw as {
    id: number;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    deadline: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    createdBy?: { id: number; name: string };
    department?: { id: number; name: string };
    assignees?: Array<{
      id: number;
      userId: number;
      user: { id: number; name: string };
      individualStatus: TaskStatus;
    }>;
  };

  const deadlineDate = new Date(r.deadline);
  const now = new Date();
  const diffDays = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let deadlineLabel: string;
  if (r.status === 'completed') deadlineLabel = 'Completed';
  else if (diffDays < 0) deadlineLabel = `${Math.abs(diffDays)} days overdue`;
  else if (diffDays === 0) deadlineLabel = 'Today';
  else if (diffDays === 1) deadlineLabel = 'Tomorrow';
  else if (diffDays < 7) deadlineLabel = `In ${diffDays} days`;
  else deadlineLabel = deadlineDate.toLocaleDateString();

  return {
    id: r.id,
    title: r.title,
    description: r.description,
    createdBy: r.createdBy?.id ?? 0,
    createdByName: r.createdBy?.name,
    departmentId: r.department?.id ?? 0,
    departmentName: r.department?.name ?? '',
    priority: r.priority,
    status: r.status,
    deadline: r.deadline,
    deadlineLabel,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    assignees: (r.assignees || []).map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.user.name,
      initials: getInitials(a.user.name),
      color: assigneeColor(a.userId),
      individualStatus: a.individualStatus,
    })),
    createdAt: r.createdAt,
  };
}

export function normalizeReport(raw: unknown): Report {
  const r = raw as {
    id: number;
    userId: number;
    user?: { id: number; name: string; department?: { name: string } };
    taskId?: number;
    reportType: 'daily' | 'weekly' | 'task';
    description: string;
    reportDate: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    reviewedBy?: { id: number; name: string };
    reviewedAt?: string;
    reviewComment?: string;
    visibleToSuperAdmin: boolean;
    createdAt: string;
  };

  const date = new Date(r.reportDate);
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return {
    id: r.id,
    userId: r.userId,
    userName: r.user?.name || 'Unknown',
    userInitials: getInitials(r.user?.name || 'U'),
    userColor: assigneeColor(r.userId),
    departmentName: r.user?.department?.name || '',
    taskId: r.taskId,
    reportType: r.reportType,
    description: r.description,
    reportDate: dateLabel,
    approvalStatus: r.approvalStatus,
    reviewedByName: r.reviewedBy?.name,
    reviewedAt: r.reviewedAt,
    reviewComment: r.reviewComment,
    visibleToSuperAdmin: r.visibleToSuperAdmin,
    createdAt: r.createdAt,
  };
}
