'use client';

import { PageHeader } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { MyTeamList } from '@/modules/employee/team/components/MyTeamList';

export default function MyTeamPage() {
  const departmentName = useAuthStore((s) => s.user?.departmentName);
  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader
        title="My Team"
        subtitle={
          departmentName
            ? `Your team leader and teammates in the ${departmentName} department.`
            : "You aren't assigned to a department yet — ask your admin to set one."
        }
      />
      <MyTeamList />
    </div>
  );
}
