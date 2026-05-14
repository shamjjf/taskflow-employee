'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { TeamPerformanceOverview } from '@/modules/employee/team/components/TeamPerformanceOverview';
import { useRole } from '@/hooks/useRole';

export default function TeamPerformancePage() {
  const { isTeamLeader } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isTeamLeader) {
      router.replace('/team');
    }
  }, [isTeamLeader, router]);

  if (!isTeamLeader) return null;

  return (
    <div className="animate-fade-in max-w-5xl">
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[#71717a] hover:text-[#18181b] mb-3 transition-colors"
      >
        <ArrowLeft size={12} /> Back to My Team
      </Link>
      <PageHeader
        title="Team Performance"
        subtitle="Track how your team is doing — completion rates, workload, and trends."
      />
      <TeamPerformanceOverview />
    </div>
  );
}
