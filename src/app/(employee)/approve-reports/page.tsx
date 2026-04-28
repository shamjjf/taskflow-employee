'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { ApprovalsList } from '@/modules/employee/approval/components/ApprovalsList';
import { useRole } from '@/hooks/useRole';

export default function ApproveReportsPage() {
  const { isTeamLeader } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isTeamLeader) {
      router.replace('/dashboard');
    }
  }, [isTeamLeader, router]);

  if (!isTeamLeader) return null;

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader
        title="Approve Reports"
        subtitle="Review reports from your team members. Approved reports forward to Super Admin."
      />
      <ApprovalsList />
    </div>
  );
}
