'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, Badge } from '@/components/ui';
import { Calendar } from 'lucide-react';
import { employeeTasksService } from '../../tasks/services/employeeTasksService';
import { normalizeTask } from '@/lib/normalizers';

export function UpcomingDeadlines() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
  });

  const tasks = (data || []).map(normalizeTask);
  const upcoming = tasks.filter((t) => t.status !== 'completed').slice(0, 4);

  return (
    <Card>
      <CardHeader title="Upcoming Deadlines" subtitle="Next 7 days" />
      <div>
        {isLoading ? (
          <div className="px-5 py-8 text-center text-[#71717a] text-sm">Loading...</div>
        ) : upcoming.length === 0 ? (
          <div className="px-5 py-8 text-center text-[#71717a] text-sm">No upcoming deadlines 🎉</div>
        ) : (
          upcoming.map((task, i) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 px-4 sm:px-5 py-3 ${
                i < upcoming.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                  task.priority === 'high'
                    ? 'bg-[#fef2f2] text-[#dc2626]'
                    : task.priority === 'medium'
                    ? 'bg-[#fffbeb] text-[#d97706]'
                    : 'bg-[#ecfdf5] text-[#059669]'
                }`}
              >
                <Calendar size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] sm:text-[13px] font-medium break-words">{task.title}</div>
                <div className="text-[11px] sm:text-[11.5px] text-[#71717a] mt-0.5">Due: {task.deadlineLabel}</div>
              </div>
              <Badge
                variant={
                  task.status === 'in_progress'
                    ? 'warning'
                    : task.status === 'overdue'
                    ? 'danger'
                    : 'info'
                }
              >
                {task.status === 'in_progress'
                  ? 'In Progress'
                  : task.status === 'overdue'
                  ? 'Overdue'
                  : 'To Do'}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
