'use client';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { MyTasksList } from '@/modules/employee/tasks/components/MyTasksList';
import { useUIStore } from '@/store/uiStore';
import { Plus } from 'lucide-react';

export default function MyTasksPage() {
  const openTaskModal = useUIStore((s) => s.openTaskModal);

  return (
    <div className="animate-fade-in">
      
      <PageHeader
        title="My Tasks"
        subtitle="All tasks assigned to you. Start them, update status, and mark complete."
        action={
          <Button variant="primary" onClick={openTaskModal}>
            <Plus size={14} strokeWidth={2.5} />
            Assign Task
          </Button>
        }
      />
      <MyTasksList />
    </div>
  );
}
