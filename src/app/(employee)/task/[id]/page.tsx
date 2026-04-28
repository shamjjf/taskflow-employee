'use client';

import { TaskDetail } from '@/modules/employee/tasks/components/TaskDetail';

interface PageProps {
  params: { id: string };
}

export default function TaskDetailPage({ params }: PageProps) {
  return (
    <div className="animate-fade-in">
      <TaskDetail taskId={Number(params.id)} />
    </div>
  );
}
