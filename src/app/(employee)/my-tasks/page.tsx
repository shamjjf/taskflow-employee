'use client';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { MyTasksList } from '@/modules/employee/tasks/components/MyTasksList';
import { useUIStore } from '@/store/uiStore';
import { Plus, UserPlus } from 'lucide-react';
import { useRole } from '@/hooks/useRole';

export default function MyTasksPage() {
  const { isTeamLeader } = useRole();
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const openSelfTaskModal = useUIStore((s) => s.openSelfTaskModal);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Tasks"
        subtitle="All tasks assigned to you. Start them, update status, and mark complete."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={openSelfTaskModal}>
              <UserPlus size={14} strokeWidth={2.5} />
              Self-Assign Task
            </Button>
            {isTeamLeader && (
              <Button variant="primary" onClick={openTaskModal}>
                <Plus size={14} strokeWidth={2.5} />
                Assign Task
              </Button>
            )}
          </div>
        }
      />
      <MyTasksList />
    </div>
  );
}
