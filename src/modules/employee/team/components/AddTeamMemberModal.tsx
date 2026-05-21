'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input } from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { teamMembersService } from '../services/teamMembersService';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialForm = {
  name: '',
  email: '',
  designation: '',
  password: '',
  confirmPassword: '',
};

export function AddTeamMemberModal({ isOpen, onClose }: AddTeamMemberModalProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setShowPassword(false);
      setError('');
    }
  }, [isOpen]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createMutation = useMutation({
    mutationFn: teamMembersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['department-members', currentUser?.departmentId],
      });
      onClose();
    },
    onError: (err) => {
      const axiosErr = err as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      setError(
        axiosErr?.response?.data?.error ||
          axiosErr?.response?.data?.message ||
          axiosErr?.message ||
          'Failed to add member'
      );
    },
  });

  const handleSave = () => {
    setError('');
    if (!currentUser?.departmentId) {
      return setError('You must belong to a department to add members');
    }
    if (!form.name.trim()) return setError('Name is required');
    if (!form.email.trim()) return setError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError('Enter a valid email address');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    createMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      departmentId: currentUser.departmentId,
      designation: form.designation.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Team Member"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Adding…' : 'Add Member'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[12.5px] text-[#71717a]">
          New members are added as employees to{' '}
          <strong className="text-[#18181b]">
            {currentUser?.departmentName ?? 'your department'}
          </strong>
          .
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Full name"
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="user@company.com"
          />
          <Input
            label="Designation"
            value={form.designation}
            onChange={(e) => update('designation', e.target.value)}
            placeholder="e.g. Developer"
          />
          <div className="hidden sm:block" />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-[34px] w-7 h-7 inline-flex items-center justify-center rounded-md text-[#71717a] hover:text-[#18181b] hover:bg-surface-muted transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            placeholder="Re-enter password"
          />
        </div>

        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
