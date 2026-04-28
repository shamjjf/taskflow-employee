'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { TeamTasksKanban } from '@/modules/employee/team-tasks/components/TeamTasksKanban';
import { useRole } from '@/hooks/useRole';

export default function TeamTasksPage() {
  const { isTeamLeader } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isTeamLeader) {
      router.replace('/my-tasks');
    }
  }, [isTeamLeader, router]);

  if (!isTeamLeader) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Team Tasks"
        subtitle="All tasks across your team. Assign new tasks or track progress."
      />
      <TeamTasksKanban />
    </div>
  );
}
