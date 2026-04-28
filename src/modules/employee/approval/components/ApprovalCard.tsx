'use client';

import { useState } from 'react';
import { Avatar, Badge, Button, Card, CardBody } from '@/components/ui';
import { Check, X, MessageSquareText } from 'lucide-react';
import type { Report } from '@/types';

interface ApprovalCardProps {
  report: Report;
  onDone: (id: number) => void;
}

export function ApprovalCard({ report, onDone }: ApprovalCardProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setLoading(false);
    alert(
      `✓ Report approved! It's now visible to the Super Admin. ${report.userName} has been notified.`
    );
    onDone(report.id);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      alert('Please provide a reason for rejection so the employee can revise.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setLoading(false);
    alert(
      `Report rejected. ${report.userName} has been notified with your feedback and can revise & resubmit.`
    );
    onDone(report.id);
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

        {action === 'reject' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium mb-1.5 flex items-center gap-1.5">
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
              <Button variant="secondary" size="sm" onClick={() => { setAction(null); setRejectComment(''); }}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleReject} disabled={loading || !rejectComment.trim()}>
                <X size={12} />
                Confirm Rejection
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleApprove} disabled={loading}>
              <Check size={12} strokeWidth={2.5} />
              {loading ? 'Approving...' : 'Approve & Forward to Super Admin'}
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
