'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { X, Send, Flag, Calendar, Clock3, MessageSquareText } from 'lucide-react';
import { TASK_PRIORITY_LABELS } from '@/constants';
import { employeeTasksService } from '@/modules/employee/tasks/services/employeeTasksService';
import { normalizeTask } from '@/lib/normalizers';
import { useAuthStore } from '@/store/authStore';
import type { Task } from '@/types';

interface TeamTaskDetailModalProps {
  taskId: number | null;
  onClose: () => void;
}

const priorityPill: Record<string, string> = {
  high: 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]',
  medium: 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]',
  low: 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]',
};

const statusPill: Record<string, string> = {
  assigned: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1d4ed8]',
  in_progress: 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]',
  completed: 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]',
  overdue: 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]',
};

const statusLabel: Record<string, string> = {
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function TeamTaskDetailModal({ taskId, onClose }: TeamTaskDetailModalProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [newComment, setNewComment] = useState('');

  const isOpen = taskId !== null;

  const { data: rawTask, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => employeeTasksService.getTask(taskId as number),
    enabled: isOpen,
  });

  const { data: comments } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => employeeTasksService.getComments(taskId as number),
    enabled: isOpen,
  });

  const task: Task | null = rawTask ? normalizeTask(rawTask) : null;

  const commentMutation = useMutation({
    mutationFn: (message: string) =>
      employeeTasksService.addComment(taskId as number, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setNewComment('');
    },
  });

  const handleSend = () => {
    const msg = newComment.trim();
    if (!msg) return;
    commentMutation.mutate(msg);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e4e4e7]"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !task ? (
          <div className="px-7 py-16 text-center text-[#71717a] text-sm">Loading task...</div>
        ) : (
          <>
            {/* Header */}
            <div className="px-7 pt-6 pb-5 border-b border-[#f4f4f5]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#a1a1aa]">
                      Task · {task.departmentName || 'No Dept'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#d4d4d8]" />
                    <span className="text-[11px] font-medium text-[#a1a1aa]">#TSK-{task.id}</span>
                  </div>
                  <h1 className="text-[22px] leading-[1.2] font-semibold text-[#18181b] tracking-tight">
                    {task.title}
                  </h1>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-[#f4f4f5] flex items-center justify-center text-[#71717a] transition shrink-0"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Pills row */}
            <div className="px-7 py-4 flex flex-wrap items-center gap-2 border-b border-[#f4f4f5] bg-[#fafafa]">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
                  statusPill[task.status]
                )}
              >
                <Clock3 size={12} strokeWidth={2.5} />
                {statusLabel[task.status]}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
                  priorityPill[task.priority]
                )}
              >
                <Flag size={12} strokeWidth={2.5} fill="currentColor" />
                {TASK_PRIORITY_LABELS[task.priority]} priority
              </span>
              {task.deadline && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#e4e4e7] text-[#52525b] text-xs font-medium">
                  <Calendar size={12} strokeWidth={2.5} />
                  Due {formatDate(task.deadline)}
                </span>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <div className="px-7 py-5 border-b border-[#f4f4f5]">
                <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#a1a1aa] block mb-2">
                  Description
                </span>
                <p className="text-sm leading-relaxed text-[#3f3f46]">{task.description}</p>
              </div>
            )}

            {/* Meta grid */}
            <div className="px-7 py-5 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-[#f4f4f5]">
              <MetaRow
                label="Created by"
                value={task.createdByName || 'Unknown'}
                muted={!task.createdByName}
              />
              <MetaRow
                label="Department"
                value={task.departmentName || '—'}
                muted={!task.departmentName}
              />
              <MetaRow label="Started" value={formatDate(task.startedAt)} muted={!task.startedAt} />
              <MetaRow label="Created" value={formatDate(task.createdAt)} />
            </div>

            {/* Assignees */}
            <div className="px-7 py-5 border-b border-[#f4f4f5]">
              <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#a1a1aa] block mb-3">
                Assignees
              </span>
              {task.assignees.length === 0 ? (
                <span className="text-sm text-[#a1a1aa]">No one assigned</span>
              ) : (
                <div className="flex items-center flex-wrap gap-2">
                  {task.assignees.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#f4f4f5]"
                    >
                      <Avatar initials={a.initials} color={a.color} size="sm" />
                      <span className="text-xs font-medium text-[#3f3f46]">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="px-7 py-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareText size={14} className="text-[#a1a1aa]" />
                <span className="text-sm font-semibold text-[#27272a]">Comments</span>
                <span className="text-xs text-[#a1a1aa]">· {comments?.length || 0}</span>
              </div>

              {!comments || comments.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-[#a1a1aa] italic">
                    Quiet here — be the first to chime in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {comments.map((c) => {
                    const user = (c as unknown as { user?: { id: number; name: string } }).user;
                    const name = user?.name || 'Unknown';
                    return (
                      <div key={c.id} className="flex gap-3">
                        <Avatar
                          initials={getInitials(name)}
                          color={colorForId(user?.id || 0)}
                          size="sm"
                        />
                        <div className="flex-1 bg-[#fafafa] rounded-lg px-3 py-2.5">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-[13px] font-medium text-[#27272a]">{name}</span>
                            <span className="text-[11px] text-[#a1a1aa]">
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          {c.message && (
                            <div className="text-[13px] leading-relaxed text-[#3f3f46]">
                              {c.message}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comment composer */}
              <div className="flex items-end gap-2 mt-2">
                <Avatar
                  initials={getInitials(currentUser?.name || 'U')}
                  color={colorForId(currentUser?.id || 0)}
                  size="sm"
                />
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="w-full resize-none px-3.5 py-2.5 text-sm bg-[#fafafa] border border-[#e4e4e7] rounded-xl placeholder:text-[#a1a1aa] focus:outline-none focus:bg-white focus:border-[#d4d4d8] focus:ring-4 focus:ring-[#f4f4f5] transition"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className="w-10 h-10 rounded-xl bg-[#18181b] text-white flex items-center justify-center hover:bg-[#27272a] disabled:bg-[#e4e4e7] disabled:text-[#a1a1aa] transition shadow-sm shrink-0"
                  aria-label="Send comment"
                >
                  <Send size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#a1a1aa] mb-0.5">
        {label}
      </div>
      <div
        className={cn(
          'text-sm font-medium tabular-nums',
          muted ? 'text-[#a1a1aa]' : 'text-[#27272a]'
        )}
      >
        {value}
      </div>
    </div>
  );
}
