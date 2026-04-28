'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/shared';
import { ClipboardList, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { employeeTasksService } from '../../tasks/services/employeeTasksService';

export function EmployeeDashboardStats() {
  const { data } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
  });

  const tasks = data || [];
  const total = tasks.length;
  const toDo = tasks.filter((t) => t.status === 'assigned').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Tasks" value={total} icon={ClipboardList} />
      <StatCard label="To Do" value={toDo} icon={AlertCircle} />
      <StatCard label="In Progress" value={inProgress} icon={Play} />
      <StatCard label="Completed" value={completed} icon={CheckCircle} />
    </div>
  );
}
