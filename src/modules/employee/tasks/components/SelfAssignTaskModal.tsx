'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import { useRole } from '@/hooks/useRole';
import { employeeTasksService } from '../services/employeeTasksService';
import type { TaskPriority } from '@/types';

export function SelfAssignTaskModal() {
  const { isSelfTaskModalOpen, closeSelfTaskModal } = useUIStore();
  const { isTeamLeader } = useRole();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reportToId, setReportToId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading: optionsLoading } = useQuery({
    queryKey: ['report-to-options'],
    queryFn: () => employeeTasksService.getReportToOptions(),
    enabled: isSelfTaskModalOpen,
  });
  const options = data || [];

  // Preselect the first option. For an employee there is exactly one — their
  // team leader — so the field is effectively fixed.
  useEffect(() => {
    if (isSelfTaskModalOpen && options.length > 0 && !reportToId) {
      setReportToId(String(options[0].id));
    }
  }, [isSelfTaskModalOpen, options, reportToId]);

  const reportToLabel = isTeamLeader ? 'Report To (Sub-Admin) *' : 'Report To (Team Leader) *';
  const reportToWho = isTeamLeader ? 'the selected Sub-Admin' : 'your Team Leader';
  const emptyHint = isTeamLeader
    ? 'No Sub-Admin is available to report to. Please contact the Super Admin.'
    : 'No Team Leader is assigned to your department yet. Please contact an admin.';

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setReportToId('');
    setPriority('medium');
    setDeadline('');
    setError('');
  };

  const createMutation = useMutation({
    mutationFn: () =>
      employeeTasksService.createSelfTask({
        title,
        description: description || undefined,
        priority,
        deadline: new Date(deadline).toISOString(),
        reportToId: reportToId ? Number(reportToId) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      resetForm();
      closeSelfTaskModal();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to create task');
    },
  });

  const handleCreate = () => {
    setError('');
    if (!title.trim() || !deadline) {
      setError('Please fill in all required fields.');
      return;
    }
    if (options.length === 0) {
      setError(emptyHint);
      return;
    }
    if (!reportToId) {
      setError('Please choose who to report to.');
      return;
    }
    createMutation.mutate();
  };

  const handleClose = () => {
    resetForm();
    closeSelfTaskModal();
  };

  return (
    <Modal
      isOpen={isSelfTaskModalOpen}
      onClose={handleClose}
      title="Self-Assign a Task"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={createMutation.isPending || optionsLoading || options.length === 0}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </>
      }
    >
      <div className="mb-4 p-3 bg-info-soft border border-info/20 rounded-md">
        <div className="text-[12.5px] text-info leading-relaxed">
          <strong>Heads up:</strong> This task will be assigned to you. It follows the normal flow —
          start it, submit it for review, and {reportToWho} approves the completion.
        </div>
      </div>
      <div className="space-y-4">
        <Input
          label="Task Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Prepare weekly outreach summary"
        />
        <div>
          <label className="block text-[13px] font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the task details, requirements, acceptance criteria..."
            className="w-full px-3 py-2.5 border border-border rounded-[8px] bg-white focus:border-primary focus:ring-4 focus:ring-primary-soft focus:outline-none placeholder:text-[#a1a1aa] resize-none"
          />
        </div>

        {optionsLoading ? (
          <div className="text-[13px] text-[#71717a]">Loading reporting options...</div>
        ) : options.length === 0 ? (
          <div className="p-3 bg-danger-soft border border-danger/20 rounded-md text-[12.5px] text-danger">
            {emptyHint}
          </div>
        ) : (
          <Select
            label={reportToLabel}
            value={reportToId}
            onChange={(e) => setReportToId(e.target.value)}
            // Employees have a single team leader, so the field is fixed.
            disabled={!isTeamLeader}
            options={options.map((o) => ({
              value: String(o.id),
              label: `${o.name}${o.designation ? ` (${o.designation})` : ''}`,
            }))}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority *"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <Input
            label="Deadline (date & time) *"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
