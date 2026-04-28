'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import { teamTasksService } from '../services/teamTasksService';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, TaskPriority } from '@/types';

interface DeptUser {
  id: number;
  name: string;
  role: 'super_admin' | 'team_leader' | 'employee';
  designation?: string;
}

export function AssignTaskModal() {
  const { isTaskModalOpen, closeTaskModal } = useUIStore();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const { data: members } = useQuery({
    queryKey: ['department-members', currentUser?.departmentId],
    queryFn: async () => {
      if (!currentUser?.departmentId) return [];
      const res = await api.get<ApiResponse<DeptUser[]>>(
        `/departments/${currentUser.departmentId}/members`
      );
      return res.data;
    },
    enabled: isTaskModalOpen && !!currentUser?.departmentId,
  });

  const employeeMembers = (members || []).filter((m) => m.role === 'employee');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setPriority('medium');
    setDeadline('');
    setError('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.departmentId) throw new Error('No department');
      return teamTasksService.create({
        title,
        description: description || undefined,
        departmentId: currentUser.departmentId,
        priority,
        deadline: new Date(deadline).toISOString(),
        assigneeIds: [Number(assigneeId)],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      resetForm();
      closeTaskModal();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to create task');
    },
  });

  const handleCreate = () => {
    setError('');
    if (!title.trim() || !assigneeId || !deadline) {
      setError('Please fill in all required fields.');
      return;
    }
    createMutation.mutate();
  };

  const handleClose = () => {
    resetForm();
    closeTaskModal();
  };

  return (
    <Modal
      isOpen={isTaskModalOpen}
      onClose={handleClose}
      title="Assign Task to Team"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Assigning...' : 'Assign Task'}
          </Button>
        </>
      }
    >
      <div className="mb-4 p-3 bg-info-soft border border-info/20 rounded-md">
        <div className="text-[12.5px] text-info leading-relaxed">
          <strong>Scope:</strong> You can only assign tasks to members of your own department. For
          cross-department tasks, request the Super Admin.
        </div>
      </div>
      <div className="space-y-4">
        <Input
          label="Task Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Fix mobile nav bug on checkout"
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
        <Select
          label="Assign To *"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          options={[
            { value: '', label: 'Select a team member...' },
            ...employeeMembers.map((u) => ({
              value: String(u.id),
              label: `${u.name}${u.designation ? ` (${u.designation})` : ''}`,
            })),
          ]}
        />
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
            label="Deadline *"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
