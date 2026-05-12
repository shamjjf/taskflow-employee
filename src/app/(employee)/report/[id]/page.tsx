'use client';

import { ReportDetail } from '@/modules/employee/reports/components/ReportDetail';

interface PageProps {
  params: { id: string };
}

export default function ReportDetailPage({ params }: PageProps) {
  return (
    <div className="animate-fade-in">
      <ReportDetail reportId={Number(params.id)} />
    </div>
  );
}
