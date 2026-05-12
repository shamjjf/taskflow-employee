'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, Button } from '@/components/ui';
import { Calendar, CheckCircle2, Clock, Eye, RotateCcw, XCircle } from 'lucide-react';

const DESCRIPTION_PREVIEW_LIMIT = 250;
function truncateDescription(text: string) {
  if (text.length <= DESCRIPTION_PREVIEW_LIMIT) return text;
  return `${text.slice(0, DESCRIPTION_PREVIEW_LIMIT).trimEnd()}...`;
}
import { employeeReportsService } from '../services/employeeReportsService';
import { normalizeReport } from '@/lib/normalizers';
import type { Report } from '@/types';

function statusInfo(r: Report) {
  if (r.approvalStatus === 'approved') {
    return { variant: 'success' as const, icon: CheckCircle2, label: 'Approved' };
  }
  if (r.approvalStatus === 'rejected') {
    return { variant: 'danger' as const, icon: XCircle, label: 'Rejected' };
  }
  return { variant: 'warning' as const, icon: Clock, label: 'Pending TL Approval' };
}

export function MyReportsList() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => employeeReportsService.getMyReports(),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-[#71717a] text-sm">Loading reports...</div>;
  }

  const reports = (data || []).map(normalizeReport);

  if (reports.length === 0) {
    return (
      <div className="text-center py-16 text-[#71717a] text-sm">
        You haven&apos;t submitted any reports yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const status = statusInfo(report);
        const StatusIcon = status.icon;
        return (
          <Card key={report.id}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-semibold">
                      {report.reportType === 'weekly'
                        ? 'Weekly Report'
                        : report.reportType === 'daily'
                        ? 'Daily Report'
                        : 'Task Report'}
                    </span>
                    <Badge variant={status.variant}>
                      <StatusIcon size={10} />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#71717a]">
                    <Calendar size={12} />
                    <span>{report.reportDate}</span>
                    {report.reviewedByName && (
                      <>
                        <span>•</span>
                        <span>Reviewed by {report.reviewedByName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[13.5px] text-[#18181b] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                {truncateDescription(report.description)}
              </div>

              {report.approvalStatus === 'rejected' && report.reviewComment && (
                <div className="p-3 bg-danger-soft border border-danger/20 rounded-md mb-3">
                  <div className="text-[12px] text-danger font-medium mb-1">
                    Rejected by {report.reviewedByName}
                  </div>
                  <div className="text-[12.5px] text-danger/90">&quot;{report.reviewComment}&quot;</div>
                </div>
              )}

              {report.approvalStatus === 'approved' && report.visibleToSuperAdmin && (
                <div className="text-[12px] text-success flex items-center gap-1 mb-3">
                  <CheckCircle2 size={12} />
                  <span>Visible to Super Admin</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/report/${report.id}`)}
                >
                  <Eye size={12} />
                  View Report
                </Button>
                {report.approvalStatus === 'rejected' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/submit-report?id=${report.id}`)}
                  >
                    <RotateCcw size={12} />
                    Revise &amp; Resubmit
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
