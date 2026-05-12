'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, Button, Select } from '@/components/ui';
import { Send, Save, RotateCcw } from 'lucide-react';
import { employeeReportsService } from '../services/employeeReportsService';
import { employeeTasksService } from '../../tasks/services/employeeTasksService';
import { normalizeReport } from '@/lib/normalizers';
import type { ReportType } from '@/types';

export function SubmitReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);
  const reportId = editId ? Number(editId) : null;

  const [reportType, setReportType] = useState<ReportType>('daily');
  const [taskId, setTaskId] = useState('');
  const [weeklyObjective, setWeeklyObjective] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
  });

  const { data: existingReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => employeeReportsService.getReport(reportId as number),
    enabled: isEditMode && reportId !== null,
  });

  useEffect(() => {
    if (!existingReport || hydrated) return;
    const r = normalizeReport(existingReport);
    setReportType(r.reportType);
    setDescription(r.description);
    setWeeklyObjective(r.weeklyObjective ?? '');
    setTaskId(r.taskId ? String(r.taskId) : '');
    setHydrated(true);
  }, [existingReport, hydrated]);

  const submitMutation = useMutation({
    mutationFn: (payload: {
      reportType: ReportType;
      weeklyObjective?: string;
      description: string;
      taskId?: number;
    }) => employeeReportsService.submitReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      router.push('/my-reports');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to submit report');
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: (payload: {
      reportType: ReportType;
      weeklyObjective?: string | null;
      description: string;
      taskId?: number | null;
    }) => employeeReportsService.resubmitReport(reportId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
      router.push('/my-reports');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to resubmit report');
    },
  });

  const isPending = submitMutation.isPending || resubmitMutation.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!description.trim()) return;
    if (reportType === 'weekly' && !weeklyObjective.trim()) {
      setError('Please fill in the weekly objective.');
      return;
    }

    if (isEditMode && reportId) {
      resubmitMutation.mutate({
        reportType,
        weeklyObjective: reportType === 'weekly' ? weeklyObjective : null,
        description,
        taskId: taskId ? Number(taskId) : null,
      });
    } else {
      submitMutation.mutate({
        reportType,
        weeklyObjective: reportType === 'weekly' ? weeklyObjective : undefined,
        description,
        taskId: taskId ? Number(taskId) : undefined,
      });
    }
  };

  const handleSaveDraft = () => {
    alert('Draft saved locally. (Draft-saving endpoint not yet implemented on backend.)');
  };

  if (isEditMode && isLoadingReport) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-12 text-[#71717a] text-sm">Loading report...</div>
        </CardBody>
      </Card>
    );
  }

  const rejectionComment = existingReport
    ? normalizeReport(existingReport).reviewComment
    : undefined;
  const rejectionReviewer = existingReport
    ? normalizeReport(existingReport).reviewedByName
    : undefined;

  return (
    <Card>
      <CardBody>
        {isEditMode && rejectionComment && (
          <div className="p-3 bg-danger-soft border border-danger/20 rounded-md mb-5">
            <div className="text-[12px] text-danger font-medium mb-1">
              Rejected{rejectionReviewer ? ` by ${rejectionReviewer}` : ''}
            </div>
            <div className="text-[12.5px] text-danger/90">&quot;{rejectionComment}&quot;</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Report Type *"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              options={[
                { value: 'daily', label: 'Daily Report' },
                { value: 'weekly', label: 'Weekly Report' },
                { value: 'task', label: 'Task Completion Report' },
              ]}
            />
            {reportType === 'task' && (
              <Select
                label="Related Task"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                options={[
                  { value: '', label: 'Select a task...' },
                  ...(myTasks || []).map((t) => ({ value: String(t.id), label: t.title })),
                ]}
              />
            )}
          </div>

          {reportType === 'weekly' && (
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Weekly Objective *</label>
              <textarea
                value={weeklyObjective}
                onChange={(e) => setWeeklyObjective(e.target.value)}
                placeholder="What were the goals or priorities you set for this week?"
                rows={5}
                required
                className="w-full px-3 py-2.5 border border-border rounded-md bg-white focus:border-primary focus:ring-4 focus:ring-primary-soft focus:outline-none resize-none text-[13.5px] leading-relaxed"
              />
              <div className="flex justify-between mt-1.5 text-[11.5px] text-[#71717a]">
                <span>State the planned objectives for the week.</span>
                <span>{weeklyObjective.length} characters</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium mb-1.5">
              {reportType === 'weekly' ? 'Weekly Work Summary *' : 'What did you work on? *'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                reportType === 'weekly'
                  ? 'Summarize what you accomplished this week: deliverables, progress against objectives, blockers, next steps...'
                  : "Describe your work in detail: what you completed, challenges faced, progress made, what's next..."
              }
              rows={10}
              required
              className="w-full px-3 py-2.5 border border-border rounded-md bg-white focus:border-primary focus:ring-4 focus:ring-primary-soft focus:outline-none resize-none text-[13.5px] leading-relaxed"
            />
            <div className="flex justify-between mt-1.5 text-[11.5px] text-[#71717a]">
              <span>Be specific. Your Team Leader will review this.</span>
              <span>{description.length} characters</span>
            </div>
          </div>

          {error && <div className="text-xs text-danger">{error}</div>}

          <div className="p-3 bg-info-soft border border-info/20 rounded-md">
            <div className="text-[13px] text-info font-medium mb-1">📌 Approval Flow</div>
            <div className="text-[12.5px] text-info/90 leading-relaxed">
              {isEditMode ? (
                <>
                  Your revised report will be sent back to your <strong>Team Leader</strong> for
                  review. Once approved, it becomes visible to the Super Admin.
                </>
              ) : (
                <>
                  Your report goes to your <strong>Team Leader</strong> first. Once approved, it
                  becomes visible to the Super Admin.
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            {isEditMode ? (
              <span />
            ) : (
              <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                <Save size={14} />
                Save as Draft
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  isPending ||
                  !description.trim() ||
                  (reportType === 'weekly' && !weeklyObjective.trim())
                }
              >
                {isEditMode ? <RotateCcw size={14} /> : <Send size={14} />}
                {isPending
                  ? isEditMode
                    ? 'Resubmitting...'
                    : 'Submitting...'
                  : isEditMode
                  ? 'Resubmit Report'
                  : 'Submit Report'}
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
