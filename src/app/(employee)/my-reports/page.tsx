'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { MyReportsList } from '@/modules/employee/reports/components/MyReportsList';
import { FilePlus } from 'lucide-react';

export default function MyReportsPage() {
  const router = useRouter();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Reports"
        subtitle="All reports you've submitted. Track approval status from your Team Leader."
        action={
          <Button variant="primary" onClick={() => router.push('/submit-report')}>
            <FilePlus size={14} />
            New Report
          </Button>
        }
      />
      <MyReportsList />
    </div>
  );
}
