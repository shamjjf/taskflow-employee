'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { Avatar, Badge, Button, Card, CardBody } from '@/components/ui';
import { AttachmentChip } from '@/components/shared';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  Play,
  CheckCircle2,
  Paperclip,
  Send,
} from 'lucide-react';
import { TASK_PRIORITY_LABELS } from '@/constants';
import { employeeTasksService } from '../services/employeeTasksService';
import { uploadService, type UploadedFile } from '@/lib/uploadService';
import { normalizeTask } from '@/lib/normalizers';
import { useAuthStore } from '@/store/authStore';
import type { Task } from '@/types';

interface TaskDetailProps {
  taskId: number;
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
  assigned: { label: 'Assigned', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  in_review: { label: 'In Review', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
};

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

export function TaskDetail({ taskId }: TaskDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newComment, setNewComment] = useState('');
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data: rawTask, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => employeeTasksService.getTask(taskId),
  });

  const { data: comments } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => employeeTasksService.getComments(taskId),
  });

  useSocket();

  const refreshThisTask = useCallback(
    (data: unknown) => {
      const eventTaskId =
        (data as { taskId?: number })?.taskId ?? (data as { task?: { id?: number } })?.task?.id;
      if (eventTaskId !== taskId) return;
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
    [taskId, queryClient]
  );

  useSocketEvent('task:started', refreshThisTask);
  useSocketEvent('task:completed', refreshThisTask);
  useSocketEvent('task:reviewed', refreshThisTask);
  useSocketEvent('task:rejected', refreshThisTask);
  useSocketEvent('task:commented', refreshThisTask);

  const task: Task | null = rawTask ? normalizeTask(rawTask) : null;

  const startMutation = useMutation({
    mutationFn: () => employeeTasksService.startTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => employeeTasksService.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ message, attachmentUrl }: { message: string; attachmentUrl?: string }) =>
      employeeTasksService.addComment(taskId, message, attachmentUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setNewComment('');
      setAttachment(null);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const uploaded = await uploadService.uploadFile(file);
      setAttachment(uploaded);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUploadError(axiosErr?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendComment = () => {
    if (!newComment.trim() && !attachment) return;
    commentMutation.mutate({
      message: newComment.trim() || (attachment ? `📎 Attached: ${attachment.fileName}` : ''),
      attachmentUrl: attachment?.fileUrl,
    });
  };

  if (isLoading) {
    return <div className="text-center py-16 text-[#71717a]">Loading task...</div>;
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <div className="text-[#71717a]">Task not found</div>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/my-tasks')}>
          Back to My Tasks
        </Button>
      </div>
    );
  }

  const status = statusLabels[task.status];

  const handleStatusChange = () => {
    if (task.status === 'assigned') {
      startMutation.mutate();
    } else if (task.status === 'in_progress') {
      completeMutation.mutate();
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push('/my-tasks')}
        className="flex items-center gap-1.5 text-[13px] text-[#71717a] hover:text-[#18181b] mb-4 sm:mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to My Tasks
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px] lg:gap-6">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
            <h1 className="text-[18px] sm:text-[20px] lg:text-[22px] font-semibold tracking-tight leading-tight break-words min-w-0">
              {task.title}
            </h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          {task.description && (
            <p className="text-[13.5px] sm:text-[14px] text-[#71717a] leading-relaxed mb-4 sm:mb-6 break-words">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-2 sm:mb-6">
            {task.status === 'assigned' && (
              <Button
                variant="primary"
                onClick={handleStatusChange}
                disabled={startMutation.isPending}
              >
                <Play size={14} strokeWidth={2.5} />
                {startMutation.isPending ? 'Starting...' : 'Start Task'}
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                variant="primary"
                onClick={handleStatusChange}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 size={14} strokeWidth={2.5} />
                {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <Card>
            <CardBody className="py-4">
              <div className="space-y-3 text-[13px]">
                <div>
                  <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1">
                    Priority
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium border',
                      priorityStyles[task.priority]
                    )}
                  >
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                <div>
                  <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1">
                    Department
                  </div>
                  <div className="font-medium break-words">{task.departmentName}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1 flex items-center gap-1">
                    <Calendar size={11} />
                    Deadline
                  </div>
                  <div className="font-medium">{task.deadlineLabel}</div>
                </div>
                {task.startedAt && (
                  <div>
                    <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1 flex items-center gap-1">
                      <Clock size={11} />
                      Started
                    </div>
                    <div className="font-medium">{new Date(task.startedAt).toLocaleString()}</div>
                  </div>
                )}
                {task.createdByName && (
                  <div>
                    <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1">
                      <UserIcon size={11} />
                      Assigned By
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        initials={getInitials(task.createdByName)}
                        color={colorForId(task.createdBy)}
                        size="sm"
                      />
                      <span className="text-[13px] font-medium truncate">{task.createdByName}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <h2 className="text-sm font-semibold mb-3">Comments</h2>
          <div className="space-y-3 mb-4">
            {!comments || comments.length === 0 ? (
              <div className="text-xs text-[#71717a] py-2">
                No comments yet. Start the conversation.
              </div>
            ) : (
              comments.map((c) => {
                const user = (c as unknown as { user?: { id: number; name: string } }).user;
                const name = user?.name || 'Unknown';
                const attachmentUrl = (c as unknown as { attachmentUrl?: string }).attachmentUrl;
                return (
                  <div key={c.id} className="flex gap-2 sm:gap-3">
                    <Avatar initials={getInitials(name)} color={colorForId(user?.id || 0)} />
                    <div className="flex-1 min-w-0 bg-surface-muted rounded-lg px-3 py-2.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 mb-1">
                        <span className="text-[13px] font-medium break-words">{name}</span>
                        <span className="text-[11px] text-[#a1a1aa] whitespace-nowrap">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                      {c.message && (
                        <div className="text-[13.5px] leading-relaxed mb-2 break-words">
                          {c.message}
                        </div>
                      )}
                      {attachmentUrl && (
                        <div className="mt-1">
                          <AttachmentChip fileUrl={attachmentUrl} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-2 sm:gap-3 items-start">
            <Avatar
              initials={getInitials(currentUser?.name || 'U')}
              color={colorForId(currentUser?.id || 0)}
            />
            <div className="flex-1 min-w-0">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-white focus:border-primary focus:ring-4 focus:ring-primary-soft focus:outline-none resize-none text-[13.5px]"
              />

              {/* Attachment preview */}
              {attachment && (
                <div className="mt-2">
                  <AttachmentChip
                    fileUrl={attachment.fileUrl}
                    fileName={attachment.fileName}
                    fileType={attachment.fileType}
                    fileSize={attachment.fileSize}
                    onRemove={() => setAttachment(null)}
                  />
                </div>
              )}

              {uploadError && <div className="mt-2 text-xs text-danger">{uploadError}</div>}

              <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !!attachment}
                >
                  <Paperclip size={12} />
                  {uploading ? 'Uploading...' : 'Attach File'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendComment}
                  disabled={
                    commentMutation.isPending || (!newComment.trim() && !attachment)
                  }
                >
                  <Send size={12} />
                  {commentMutation.isPending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
