'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { EmployeeTaskCard } from './EmployeeTaskCard';
import { employeeTasksService } from '../services/employeeTasksService';
import { normalizeTask } from '@/lib/normalizers';
import type { Task } from '@/types';

type TabKey = 'all' | 'assigned' | 'in_progress' | 'in_review' | 'completed';

const tabs: { key: TabKey; label: string; filter: (t: Task) => boolean }[] = [
  { key: 'all', label: 'All', filter: () => true },
  { key: 'assigned', label: 'To Do', filter: (t) => t.status === 'assigned' || t.status === 'overdue' },
  { key: 'in_progress', label: 'In Progress', filter: (t) => t.status === 'in_progress' },
  { key: 'in_review', label: 'In Review', filter: (t) => t.status === 'in_review' },
  { key: 'completed', label: 'Completed', filter: (t) => t.status === 'completed' },
];

export function MyTasksList() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
    refetchInterval: 30000, // Refetch every 30 sec to catch overdue updates from backend
  });

  const tasks = useMemo(() => (data || []).map(normalizeTask), [data]);

  const filtered = useMemo(() => {
    const tab = tabs.find((t) => t.key === activeTab);
    return tab ? tasks.filter(tab.filter) : tasks;
  }, [activeTab, tasks]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setActionSuccess(msg);
      setActionError('');
    } else {
      setActionError(msg);
      setActionSuccess('');
    }
    setTimeout(() => {
      setActionError('');
      setActionSuccess('');
    }, 4000);
  };

  const startMutation = useMutation({
    mutationFn: (id: number) => employeeTasksService.startTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      showMessage('✓ Task started — status changed to In Progress', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      showMessage(axiosErr?.response?.data?.error || 'Failed to start task. Please try again.', 'error');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => employeeTasksService.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      showMessage('🎉 Task completed! Your Team Leader has been notified.', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      showMessage(axiosErr?.response?.data?.error || 'Failed to complete task. Please try again.', 'error');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (id: number) => employeeTasksService.reviewTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      showMessage('🎉 Task completed! Your Team Leader has been notified.', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      showMessage(axiosErr?.response?.data?.error || 'Failed to complete task. Please try again.', 'error');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => employeeTasksService.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      showMessage('✓ Task accepted and marked as completed.', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      showMessage(axiosErr?.response?.data?.error || 'Failed to accept task. Please try again.', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      employeeTasksService.rejectTask(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      showMessage('↺ Task sent back to In Progress with your feedback.', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      showMessage(axiosErr?.response?.data?.error || 'Failed to reject task. Please try again.', 'error');
    },
  });

  const handleTaskAction = (task: Task) => {
    setActionError('');
    setActionSuccess('');
    if (task.status === 'assigned' || task.status === 'overdue') {
      startMutation.mutate(task.id);
    } else if (task.status === 'in_progress') {
      reviewMutation.mutate(task.id);
    }
  };

  const handleAccept = (task: Task) => {
    setActionError('');
    setActionSuccess('');
    acceptMutation.mutate(task.id);
  };

  const handleReject = (task: Task, reason: string) => {
    setActionError('');
    setActionSuccess('');
    rejectMutation.mutate({ id: task.id, reason });
  };

  const getCount = (key: TabKey) => {
    const tab = tabs.find((t) => t.key === key);
    return tab ? tasks.filter(tab.filter).length : 0;
  };

  return (
    <div>
      {/* Toast messages */}
      {actionSuccess && (
        <div className="mb-4 px-4 py-2.5 bg-success-soft border border-success/20 rounded-md text-[13px] text-[#047857] font-medium">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="mb-4 px-4 py-2.5 bg-danger-soft border border-danger/20 rounded-md text-[13px] text-danger font-medium">
          {actionError}
        </div>
      )}

      <div className="flex gap-1 mb-5 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-[13.5px] font-medium border-b-2 transition-all -mb-px',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-[#71717a] hover:text-[#18181b]'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full',
                activeTab === tab.key
                  ? 'bg-primary-soft text-primary'
                  : 'bg-surface-muted text-[#71717a]'
              )}
            >
              {getCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-[#71717a] text-sm">Loading your tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#71717a] text-sm">
          No tasks in this category yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <EmployeeTaskCard
              key={task.id}
              task={task}
              onAction={handleTaskAction}
              onAccept={handleAccept}
              onReject={handleReject}
              isLoading={
                (startMutation.isPending && startMutation.variables === task.id) ||
                (completeMutation.isPending && completeMutation.variables === task.id) ||
                (reviewMutation.isPending && reviewMutation.variables === task.id)
              }
              isAccepting={acceptMutation.isPending && acceptMutation.variables === task.id}
              isRejecting={rejectMutation.isPending && rejectMutation.variables?.id === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
