'use client';

import { useRouter } from 'next/navigation';
import { cn, formatDateTime } from '@/lib/utils';
import { Badge, Button } from '@/components/ui';
import { Calendar, Clock, CheckCircle2, Play, MessageSquare, CalendarClock, X } from 'lucide-react';
import { TASK_PRIORITY_LABELS } from '@/constants';
import type { Task } from '@/types';
import { useRole } from '@/hooks/useRole';

interface EmployeeTaskCardProps {
  task: Task;
  onAction?: (task: Task) => void;
  onAccept?: (task: Task) => void;
  onReject?: (task: Task, reason: string) => void;
  isLoading?: boolean;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

const priorityStyles = {
  high: 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]',
  medium: 'text-[#d97706] bg-[#fffbeb] border-[#fde68a]',
  low: 'text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]',
};

const statusLabels: Record<
  string,
  { label: string; variant: 'info' | 'warning' | 'success' | 'danger' }
> = {
  assigned: { label: 'To Do', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  in_review: { label: 'In Review', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
};

export function EmployeeTaskCard({
  task,
  onAction,
  onAccept,
  onReject,
  isLoading = false,
  isAccepting = false,
  isRejecting = false,
}: EmployeeTaskCardProps) {
  const router = useRouter();
  const { isTeamLeader } = useRole();
  const status = statusLabels[task.status];

  const goToDetail = () => router.push(`/task/${task.id}`);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.(task);
  };

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept?.(task);
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt('Reason for sending this task back:');
    if (reason && reason.trim()) {
      onReject?.(task, reason.trim());
    }
  };

  const isOverdue = task.status === 'overdue';

  return (
    <div
      onClick={goToDetail}
      className={cn(
        'bg-white border rounded-lg p-3.5 sm:p-5 transition-all cursor-pointer',
        isOverdue
          ? 'border-danger/30 hover:border-danger hover:shadow-md'
          : 'border-border hover:border-primary hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[14px] sm:text-[15px] font-semibold mb-1 sm:mb-1.5 hover:text-primary transition-colors break-words">
            {task.title}
          </div>
          {task.description && (
            <div className="text-[12.5px] sm:text-[13px] text-[#71717a] leading-relaxed line-clamp-2">
              {task.description}
            </div>
          )}
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] sm:text-[11.5px] font-medium border',
            priorityStyles[task.priority]
          )}
        >
          {TASK_PRIORITY_LABELS[task.priority]} Priority
        </span>
        <div className="flex items-center gap-1 text-[11px] sm:text-[11.5px] text-[#71717a]">
          <Calendar size={12} />
          <span>Due: {task.deadlineLabel}</span>
        </div>
      </div>

      {/* Detailed timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-3 sm:mb-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-1 text-[10.5px] text-[#71717a] uppercase tracking-wider font-medium mb-0.5">
            <CalendarClock size={11} />
            Assigned
          </div>
          <div className="text-[11.5px] sm:text-[12px] font-medium">{formatDateTime(task.createdAt)}</div>
        </div>
        {task.startedAt && (
          <div>
            <div className="flex items-center gap-1 text-[10.5px] text-[#71717a] uppercase tracking-wider font-medium mb-0.5">
              <Play size={10} />
              Started
            </div>
            <div className="text-[11.5px] sm:text-[12px] font-medium">{formatDateTime(task.startedAt)}</div>
          </div>
        )}
        {task.completedAt && (
          <div>
            <div className="flex items-center gap-1 text-[10.5px] text-[#71717a] uppercase tracking-wider font-medium mb-0.5">
              <CheckCircle2 size={10} />
              Completed
            </div>
            <div className="text-[11.5px] sm:text-[12px] font-medium text-success">{formatDateTime(task.completedAt)}</div>
          </div>
        )}
        {!task.startedAt && !task.completedAt && task.deadline && (
          <div>
            <div className="flex items-center gap-1 text-[10.5px] text-[#71717a] uppercase tracking-wider font-medium mb-0.5">
              <Clock size={11} />
              Deadline
            </div>
            <div className={cn('text-[11.5px] sm:text-[12px] font-medium', isOverdue && 'text-danger')}>
              {formatDateTime(task.deadline)}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
        <div className="text-[11px] sm:text-[11.5px] text-[#71717a] flex flex-col gap-0.5 min-w-0">
          <span className="truncate">
            {task.createdByName ? `Assigned by ${task.createdByName}` : 'Click to view & comment'}
          </span>
          {task.assignees.length > 0 && (
            <span className="truncate">
              Assigned to {task.assignees.map((a) => a.name).join(', ')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              goToDetail();
            }}
          >
            <MessageSquare size={12} />
            <span className="hidden sm:inline">View & Comment</span>
            <span className="sm:hidden">View</span>
          </Button>
          {isTeamLeader ? (
            task.status === 'in_review' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRejectClick}
                  disabled={isRejecting || isAccepting}
                >
                  <X size={12} strokeWidth={2.5} />
                  {isRejecting ? 'Sending back...' : 'Reject'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptClick}
                  disabled={isAccepting || isRejecting}
                >
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  {isAccepting ? 'Accepting...' : 'Accept'}
                </Button>
              </>
            )
          ) : (
            <>
              {(task.status === 'assigned' || task.status === 'overdue') && (
                <Button variant="primary" size="sm" onClick={handleActionClick} disabled={isLoading}>
                  <Play size={12} strokeWidth={2.5} />
                  {isLoading ? 'Starting...' : 'Start Task'}
                </Button>
              )}
              {task.status === 'in_progress' && (
                <Button variant="primary" size="sm" onClick={handleActionClick} disabled={isLoading}>
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  {isLoading ? 'Completing...' : 'Mark Complete'}
                </Button>
              )}
              {task.status === 'in_review' && (
                <Button variant="primary" size="sm" disabled={true}>
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  {'Under review'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
