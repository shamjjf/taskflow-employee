'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { MemberPerformanceDetail } from '@/modules/employee/team/components/MemberPerformanceDetail';
import { useRole } from '@/hooks/useRole';

export default function MemberPerformancePage() {
  const { isTeamLeader } = useRole();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memberId = Number(params?.id);

  useEffect(() => {
    if (!isTeamLeader) {
      router.replace('/team');
    }
  }, [isTeamLeader, router]);

  if (!isTeamLeader) return null;

  if (!Number.isFinite(memberId)) {
    return (
      <div className="animate-fade-in max-w-5xl">
        <Link
          href="/team/performance"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[#71717a] hover:text-[#18181b] mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Team Performance
        </Link>
        <PageHeader title="Member Performance" subtitle="Invalid member id." />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl">
      <Link
        href="/team/performance"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[#71717a] hover:text-[#18181b] mb-3 transition-colors"
      >
        <ArrowLeft size={12} /> Back to Team Performance
      </Link>
      <PageHeader
        title="Member Performance"
        subtitle="Individual workload, completion rate, and recent tasks."
      />
      <MemberPerformanceDetail memberId={memberId} />
    </div>
  );
}
