'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { FilterBar, FilterSelect } from '@/components/shared';
import { teamTasksService } from '../services/teamTasksService';
import { normalizeTask } from '@/lib/normalizers';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/constants';
import type { TaskStatus, Task, TaskPriority } from '@/types';

const COLUMNS: TaskStatus[] = ['assigned', 'in_progress', 'completed', 'overdue'];

const priorityStyles = {
  high: 'text-[#dc2626] bg-[#fef2f2]',
  medium: 'text-[#d97706] bg-[#fffbeb]',
  low: 'text-[#059669] bg-[#ecfdf5]',
};

export function TeamTasksKanban() {
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['team-tasks'],
    queryFn: () => teamTasksService.list(),
  });

  const tasks = useMemo(() => (data || []).map(normalizeTask), [data]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (assigneeFilter && !t.assignees.some((a) => String(a.userId) === assigneeFilter)) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, assigneeFilter, priorityFilter]);

  const grouped = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      assigned: [],
      in_progress: [],
      completed: [],
      overdue: [],
    };
    filtered.forEach((t) => groups[t.status].push(t));
    return groups;
  }, [filtered]);

  const assigneeOptions = useMemo(() => {
    const unique = new Map<number, string>();
    tasks.forEach((t) => t.assignees.forEach((a) => unique.set(a.userId, a.name)));
    return [
      { value: '', label: 'All Team Members' },
      ...Array.from(unique.entries()).map(([id, name]) => ({ value: String(id), label: name })),
    ];
  }, [tasks]);

  return (
    <>
      <FilterBar>
        <FilterSelect value={assigneeFilter} onChange={setAssigneeFilter} options={assigneeOptions} />
        <FilterSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: '', label: 'All Priorities' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
        />
      </FilterBar>
      {isLoading ? (
        <div className="text-center py-12 text-[#71717a]">Loading team tasks...</div>
      ) : (
        <div className="grid grid-cols-4 gap-3.5">
          {COLUMNS.map((status) => (
            <div key={status} className="bg-surface-muted rounded-lg p-3 min-h-[400px]">
              <div className="flex items-center justify-between px-1.5 pb-3 text-[12.5px] font-semibold text-[#71717a] uppercase tracking-wider">
                <span>{TASK_STATUS_LABELS[status]}</span>
                <span className="bg-white text-[#71717a] px-1.5 py-px rounded-full text-[11px]">
                  {grouped[status].length}
                </span>
              </div>
              {grouped[status].length === 0 ? (
                <div className="text-center py-5 text-[#a1a1aa] text-xs">No tasks</div>
              ) : (
                grouped[status].map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border border-border rounded-md p-3 mb-2 cursor-pointer transition-all hover:border-border-strong hover:shadow-sm"
                  >
                    <div className="text-[13px] font-medium mb-2 leading-snug">{task.title}</div>
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
                          priorityStyles[task.priority as TaskPriority]
                        )}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11.5px] text-[#71717a] pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        {task.assignees.map((a) => (
                          <Avatar key={a.id} initials={a.initials} color={a.color} size="sm" />
                        ))}
                        <span>{task.assignees.map((a) => a.name.split(' ')[0]).join(', ')}</span>
                      </div>
                      <span>{task.deadlineLabel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
