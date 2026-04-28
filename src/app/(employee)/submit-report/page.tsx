'use client';

import { PageHeader } from '@/components/layout';
import { SubmitReportForm } from '@/modules/employee/reports/components/SubmitReportForm';

export default function SubmitReportPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Submit Report"
        subtitle="Share your progress with your Team Leader. They'll review before it reaches the Super Admin."
      />
      <SubmitReportForm />
    </div>
  );
}
