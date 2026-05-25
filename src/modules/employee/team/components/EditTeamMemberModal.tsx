'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Select } from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { teamMembersService } from '../services/teamMembersService';

interface Member {
  id: number;
  name: string;
  email: string;
  designation?: string;
  phone?: string;
  status: 'active' | 'inactive';
}

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

interface FormState {
  name: string;
  email: string;
  designation: string;
  phone: string;
  status: 'active' | 'inactive';
  newPassword: string;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  designation: '',
  phone: '',
  status: 'active',
  newPassword: '',
};

export function EditTeamMemberModal({ isOpen, onClose, member }: EditTeamMemberModalProps) {
  const queryClient = useQueryClient();
  const departmentId = useAuthStore((s) => s.user?.departmentId);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !member) return;
    setForm({
      name: member.name ?? '',
      email: member.email ?? '',
      designation: member.designation ?? '',
      phone: member.phone ?? '',
      status: member.status,
      newPassword: '',
    });
    setShowPassword(false);
    setError('');
  }, [isOpen, member]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!member) throw new Error('No member selected');

      const trimmedEmail = form.email.trim();
      const profilePatch: Parameters<typeof teamMembersService.update>[1] = {};
      if (form.name.trim() !== member.name) profilePatch.name = form.name.trim();
      if (trimmedEmail !== member.email) profilePatch.email = trimmedEmail;
      if ((form.designation.trim() || undefined) !== (member.designation || undefined)) {
        profilePatch.designation = form.designation.trim();
      }
      if ((form.phone.trim() || undefined) !== (member.phone || undefined)) {
        profilePatch.phone = form.phone.trim();
      }

      if (Object.keys(profilePatch).length > 0) {
        await teamMembersService.update(member.id, profilePatch);
      }
      if (form.status !== member.status) {
        await teamMembersService.updateStatus(member.id, form.status);
      }
      if (form.newPassword) {
        await teamMembersService.setPassword(member.id, form.newPassword);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-members', departmentId] });
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
          'Failed to update member'
      );
    },
  });

  const handleSave = () => {
    setError('');
    if (!member) return;
    if (!form.name.trim()) return setError('Name is required');
    if (!form.email.trim()) return setError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError('Enter a valid email address');
    }
    if (form.newPassword && form.newPassword.length < 8) {
      return setError('New password must be at least 8 characters');
    }
    saveMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : 'Edit Member'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
          <Input
            label="Designation"
            value={form.designation}
            onChange={(e) => update('designation', e.target.value)}
            placeholder="e.g. Developer"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Optional"
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => update('status', e.target.value as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-[12.5px] text-[#71717a] mb-2">
            Reset password (optional — leave blank to keep unchanged)
          </p>
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => update('newPassword', e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
        </div>

        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
