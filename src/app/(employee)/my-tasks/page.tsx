'use client';

import { PageHeader } from '@/components/layout';
import { MyTasksList } from '@/modules/employee/tasks/components/MyTasksList';

export default function MyTasksPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Tasks"
        subtitle="All tasks assigned to you. Start them, update status, and mark complete."
      />
      <MyTasksList />
    </div>
  );
}
