'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { EmployeeTaskCard } from './EmployeeTaskCard';
import { employeeTasksService } from '../services/employeeTasksService';
import { normalizeTask } from '@/lib/normalizers';
import type { Task } from '@/types';

type TabKey = 'all' | 'assigned' | 'in_progress' | 'completed';

const tabs: { key: TabKey; label: string; filter: (t: Task) => boolean }[] = [
  { key: 'all', label: 'All', filter: () => true },
  { key: 'assigned', label: 'To Do', filter: (t) => t.status === 'assigned' },
  { key: 'in_progress', label: 'In Progress', filter: (t) => t.status === 'in_progress' },
  { key: 'completed', label: 'Completed', filter: (t) => t.status === 'completed' },
];

export function MyTasksList() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
  });

  const tasks = useMemo(() => (data || []).map(normalizeTask), [data]);

  const filtered = useMemo(() => {
    const tab = tabs.find((t) => t.key === activeTab);
    return tab ? tasks.filter(tab.filter) : tasks;
  }, [activeTab, tasks]);

  const startMutation = useMutation({
    mutationFn: (id: number) => employeeTasksService.startTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => employeeTasksService.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  const handleTaskAction = (task: Task) => {
    if (task.status === 'assigned') {
      startMutation.mutate(task.id);
    } else if (task.status === 'in_progress') {
      completeMutation.mutate(task.id);
    }
  };

  const getCount = (key: TabKey) => {
    const tab = tabs.find((t) => t.key === key);
    return tab ? tasks.filter(tab.filter).length : 0;
  };

  return (
    <div>
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
            <EmployeeTaskCard key={task.id} task={task} onAction={handleTaskAction} />
          ))}
        </div>
      )}
    </div>
  );
}
