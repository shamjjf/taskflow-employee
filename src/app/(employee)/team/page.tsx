'use client';

import { PageHeader } from '@/components/layout';
import { MyTeamList } from '@/modules/employee/team/components/MyTeamList';

export default function MyTeamPage() {
  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader
        title="My Team"
        subtitle="Your team leader and teammates in the Development department."
      />
      <MyTeamList />
    </div>
  );
}
