'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import type { ApiResponse, Task } from '@/types';

interface ExtendDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

// Converts an ISO timestamp to the `YYYY-MM-DDTHH:mm` string that
// <input type="datetime-local"> expects, in the user's local timezone.
function toLocalInputValue(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExtendDeadlineModal({ isOpen, onClose, task }: ExtendDeadlineModalProps) {
  const queryClient = useQueryClient();
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !task) return;
    setDeadline(toLocalInputValue(task.deadline));
    setError('');
  }, [isOpen, task]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error('No task');
      const res = await api.put<ApiResponse<Task>>(`/tasks/${task.id}`, {
        deadline: new Date(deadline).toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      if (task) queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      onClose();
    },
    onError: (err) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to update deadline');
    },
  });

  const handleSave = () => {
    setError('');
    if (!deadline) {
      setError('Pick a new date and time');
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? `Extend deadline — ${task.title}` : 'Extend deadline'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="New deadline (date & time)"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <p className="text-[12px] text-[#71717a] leading-relaxed">
          Only active tasks (To Do, In Progress, Overdue) can have their deadline changed. Completed
          tasks are locked.
        </p>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
