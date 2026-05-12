'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { SubmitReportForm } from '@/modules/employee/reports/components/SubmitReportForm';

function SubmitReportContent() {
  const searchParams = useSearchParams();
  const isEditMode = Boolean(searchParams.get('id'));

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title={isEditMode ? 'Revise & Resubmit Report' : 'Submit Report'}
        subtitle={
          isEditMode
            ? 'Update your report based on your Team Leader’s feedback and resubmit for review.'
            : "Share your progress with your Team Leader. They'll review before it reaches the Super Admin."
        }
      />
      <SubmitReportForm />
    </div>
  );
}

export default function SubmitReportPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-[#71717a] text-sm">Loading...</div>}>
      <SubmitReportContent />
    </Suspense>
  );
}
