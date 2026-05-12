'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Badge, Button, Card, CardBody } from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { employeeReportsService } from '../services/employeeReportsService';
import { normalizeReport } from '@/lib/normalizers';
import { formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';

interface ReportDetailProps {
  reportId: number;
}

function statusInfo(r: Report) {
  if (r.approvalStatus === 'approved') {
    return { variant: 'success' as const, icon: CheckCircle2, label: 'Approved' };
  }
  if (r.approvalStatus === 'rejected') {
    return { variant: 'danger' as const, icon: XCircle, label: 'Rejected' };
  }
  return { variant: 'warning' as const, icon: Clock, label: 'Pending TL Approval' };
}

const reportTypeLabel = (type: Report['reportType']) =>
  type === 'weekly' ? 'Weekly Report' : type === 'daily' ? 'Daily Report' : 'Task Report';

export function ReportDetail({ reportId }: ReportDetailProps) {
  const router = useRouter();

  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => employeeReportsService.getReport(reportId),
    enabled: !Number.isNaN(reportId),
  });

  if (isLoading) {
    return <div className="text-center py-16 text-[#71717a]">Loading report...</div>;
  }

  if (isError || !raw) {
    return (
      <div className="text-center py-16">
        <div className="text-[#71717a]">Report not found.</div>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const report = normalizeReport(raw);
  const status = statusInfo(report);
  const StatusIcon = status.icon;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] text-[#71717a] hover:text-[#18181b] mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <Card>
        <CardBody>
          <div className="flex items-start gap-3 mb-4">
            <Avatar initials={report.userInitials} color={report.userColor} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[16px] font-semibold">{report.userName}</span>
                <Badge variant={status.variant}>
                  <StatusIcon size={10} />
                  {status.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-[#71717a]">
                <span>{reportTypeLabel(report.reportType)}</span>
                {report.departmentName && (
                  <>
                    <span aria-hidden>•</span>
                    <span>{report.departmentName}</span>
                  </>
                )}
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {report.reportDate}
                </span>
              </div>
            </div>
          </div>

          {report.reportType === 'weekly' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-muted border border-border rounded-md p-4">
                <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-2">
                  Weekly Objective
                </div>
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                  {report.weeklyObjective?.trim()
                    ? report.weeklyObjective
                    : <span className="text-[#a1a1aa] italic">No objective recorded.</span>}
                </div>
              </div>
              <div className="bg-surface-muted border border-border rounded-md p-4">
                <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-2">
                  Weekly Work Summary
                </div>
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                  {report.description}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-muted border border-border rounded-md p-4 mb-4">
              <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-2">
                Report
              </div>
              <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                {report.description}
              </div>
            </div>
          )}

          {report.approvalStatus === 'rejected' && report.reviewComment && (
            <div className="p-3 bg-danger-soft border border-danger/20 rounded-md mb-4">
              <div className="text-[12px] text-danger font-medium mb-1">
                Rejected by {report.reviewedByName}
              </div>
              <div className="text-[13px] text-danger/90 whitespace-pre-wrap break-words">
                &quot;{report.reviewComment}&quot;
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] mb-4">
            <div>
              <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1">
                Submitted
              </div>
              <div>{formatDateTime(report.createdAt)}</div>
            </div>
            {report.reviewedAt && (
              <div>
                <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1">
                  Reviewed
                </div>
                <div>{formatDateTime(report.reviewedAt)}</div>
              </div>
            )}
            {report.reviewedByName && (
              <div>
                <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1">
                  Reviewed By
                </div>
                <div>{report.reviewedByName}</div>
              </div>
            )}
            {report.approvalStatus === 'approved' && report.visibleToSuperAdmin && (
              <div>
                <div className="text-[11.5px] text-[#71717a] uppercase tracking-wider font-medium mb-1">
                  Visibility
                </div>
                <div className="inline-flex items-center gap-1 text-success">
                  <CheckCircle2 size={12} />
                  Visible to Super Admin
                </div>
              </div>
            )}
          </div>

          {report.approvalStatus === 'rejected' && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/submit-report?id=${report.id}`)}
              >
                <RotateCcw size={12} />
                Revise &amp; Resubmit
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
