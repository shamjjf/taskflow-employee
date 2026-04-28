'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Avatar, Badge, Button, Card, CardBody } from '@/components/ui';
import { Check, X, MessageSquareText } from 'lucide-react';
import { approvalService } from '../services/approvalService';
import { employeeReportsService } from '../../reports/services/employeeReportsService';
import { normalizeReport } from '@/lib/normalizers';
import type { Report } from '@/types';

type TabKey = 'pending' | 'reviewed';

interface ApprovalCardProps {
  report: Report;
}

function ApprovalCard({ report }: ApprovalCardProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [error, setError] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => approvalService.approve(report.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (comment: string) => approvalService.reject(report.id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      setAction(null);
      setRejectComment('');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to reject');
    },
  });

  const handleReject = () => {
    setError('');
    if (!rejectComment.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    rejectMutation.mutate(rejectComment);
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3 mb-3">
          <Avatar initials={report.userInitials} color={report.userColor} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[15px] font-semibold">{report.userName}</span>
              <Badge variant="warning">Pending Your Approval</Badge>
            </div>
            <div className="text-[12px] text-[#71717a]">
              {report.reportType === 'weekly' ? 'Weekly Report' : 'Daily Report'} · {report.reportDate}
            </div>
          </div>
        </div>

        <div className="bg-surface-muted border border-border rounded-md p-3 mb-4">
          <div className="text-[13.5px] leading-relaxed">{report.description}</div>
        </div>

        {error && <div className="text-xs text-danger mb-2">{error}</div>}

        {action === 'reject' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[13px] font-medium mb-1.5 flex items-center gap-1.5">
                <MessageSquareText size={13} />
                Rejection Reason *
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={3}
                placeholder="Explain what needs to be improved so the employee can revise..."
                className="w-full px-3 py-2 border border-border rounded-md bg-white focus:border-primary focus:ring-4 focus:ring-primary-soft focus:outline-none resize-none text-[13px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAction(null);
                  setRejectComment('');
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectComment.trim()}
              >
                <X size={12} />
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <Check size={12} strokeWidth={2.5} />
              {approveMutation.isPending
                ? 'Approving...'
                : 'Approve & Forward to Super Admin'}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setAction('reject')}>
              <X size={12} />
              Reject
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function ApprovalsList() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  const { data: pendingRaw, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => approvalService.listPending(),
  });

  // Reviewed reports come from "my-reports" if we're the reviewer; use department reports
  const { data: allRaw } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => employeeReportsService.getMyReports(),
  });

  const pending = (pendingRaw || []).map(normalizeReport);
  const reviewed = (allRaw || [])
    .map(normalizeReport)
    .filter((r) => r.approvalStatus !== 'pending');

  const displayed = activeTab === 'pending' ? pending : reviewed;

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-border">
        {[
          { key: 'pending' as TabKey, label: 'Pending My Review', count: pending.length },
          { key: 'reviewed' as TabKey, label: 'Reviewed', count: reviewed.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-[13.5px] font-medium border-b-2 transition-all -mb-px',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-[#71717a] hover:text-[#18181b]'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full',
                activeTab === tab.key
                  ? 'bg-primary-soft text-primary'
                  : 'bg-surface-muted text-[#71717a]'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loadingPending && activeTab === 'pending' ? (
        <div className="text-center py-16 text-[#71717a]">Loading...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-[#71717a]">
          {activeTab === 'pending' ? (
            <>
              <div className="text-[15px] font-medium mb-1">🎉 All caught up!</div>
              <div className="text-[13px]">No reports waiting for your approval.</div>
            </>
          ) : (
            'No reviewed reports yet.'
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((report) =>
            activeTab === 'pending' ? (
              <ApprovalCard key={report.id} report={report} />
            ) : (
              <div key={report.id} className="bg-white border border-border rounded-lg p-5">
                <div className="flex items-start gap-3 mb-2">
                  <Avatar
                    initials={report.userInitials}
                    color={report.userColor}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{report.userName}</span>
                      <Badge
                        variant={report.approvalStatus === 'approved' ? 'success' : 'danger'}
                      >
                        {report.approvalStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      </Badge>
                    </div>
                    <div className="text-[12px] text-[#71717a]">
                      {report.reportType === 'weekly' ? 'Weekly' : 'Daily'} Report ·{' '}
                      {report.reportDate}
                    </div>
                  </div>
                </div>
                <div className="text-[13px] leading-relaxed text-[#71717a] mt-2">
                  {report.description}
                </div>
                {report.approvalStatus === 'rejected' && report.reviewComment && (
                  <div className="mt-3 text-[12.5px] text-danger bg-danger-soft border border-danger/20 rounded-md p-2.5">
                    <strong>Rejection reason:</strong> {report.reviewComment}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
