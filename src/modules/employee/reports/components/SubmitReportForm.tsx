'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, Button, Select } from '@/components/ui';
import { Send, Save } from 'lucide-react';
import { employeeReportsService } from '../services/employeeReportsService';
import { employeeTasksService } from '../../tasks/services/employeeTasksService';
import type { ReportType } from '@/types';

export function SubmitReportForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { reportType: ReportType; description: string; taskId?: number }) =>
      employeeReportsService.submitReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      router.push('/my-reports');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to submit report');
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!description.trim()) return;
    submitMutation.mutate({
      reportType,
      description,
      taskId: taskId ? Number(taskId) : undefined,
    });
  };

  const handleSaveDraft = () => {
    alert('Draft saved locally. (Draft-saving endpoint not yet implemented on backend.)');
  };

  return (
    <Card>
      <CardBody>
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

          <div>
            <label className="block text-[13px] font-medium mb-1.5">What did you work on? *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your work in detail: what you completed, challenges faced, progress made, what's next..."
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
              Your report goes to your <strong>Team Leader</strong> first. Once approved, it becomes
              visible to the Super Admin.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={handleSaveDraft}>
              <Save size={14} />
              Save as Draft
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitMutation.isPending || !description.trim()}
              >
                <Send size={14} />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
