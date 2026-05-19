'use client';

import { FormEvent, useRef, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, CardHeader, CardBody, Avatar, Input, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/modules/auth/services/profileService';
import { uploadService } from '@/lib/uploadService';
import type { User } from '@/types';

type Status = { type: 'success' | 'error'; message: string } | null;

const errorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { error?: string; message?: string } } };
  return e?.response?.data?.error || e?.response?.data?.message || fallback;
};

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const canEditDesignation = user?.role === 'super_admin';

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<Status>(null);

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<Status>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileStatus(null);
    if (!name.trim()) {
      setProfileStatus({ type: 'error', message: 'Name is required' });
      return;
    }
    setSavingProfile(true);
    try {
      const payload: Parameters<typeof profileService.updateProfile>[0] = {
        name: name.trim(),
        phone: phone.trim() || undefined,
      };
      if (canEditDesignation) payload.designation = designation.trim() || undefined;
      const updated = await profileService.updateProfile(payload);
      setUser({ ...user, ...updated } as User);
      setProfileStatus({ type: 'success', message: 'Profile updated' });
    } catch (err) {
      setProfileStatus({ type: 'error', message: errorMessage(err, 'Failed to update profile') });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      setPhotoStatus({ type: 'error', message: 'Please select an image file' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoStatus({ type: 'error', message: 'Image must be smaller than 10 MB' });
      return;
    }
    setPhotoStatus(null);
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadService.uploadFile(file);
      const updated = await profileService.updateProfile({ profileImage: uploaded.fileUrl });
      setUser({ ...user, ...updated } as User);
      setPhotoStatus({ type: 'success', message: 'Photo updated' });
    } catch (err) {
      setPhotoStatus({ type: 'error', message: errorMessage(err, 'Failed to update photo') });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'All password fields are required' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match' });
      return;
    }
    setUpdatingPassword(true);
    try {
      await profileService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus({ type: 'success', message: 'Password updated' });
    } catch (err) {
      setPasswordStatus({ type: 'error', message: errorMessage(err, 'Failed to update password') });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const statusClass = (type: 'success' | 'error') =>
    type === 'success' ? 'text-success' : 'text-danger';

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Profile" subtitle="Manage your personal information" />

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleSaveProfile}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar
                  initials={user?.initials || 'U'}
                  color={user?.color}
                  src={user?.profileImage}
                  size="lg"
                  className="w-16 h-16 text-lg shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[18px] font-semibold truncate">{user?.name}</div>
                  <div className="text-[13px] text-[#71717a] truncate">{user?.designation}</div>
                  <div className="text-[12px] text-[#71717a] mt-1 truncate">
                    {user?.departmentName} Department
                  </div>
                  {photoStatus && (
                    <p className={`mt-1 text-xs ${statusClass(photoStatus.type)}`}>
                      {photoStatus.message}
                    </p>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelected}
              />
              <Button
                type="button"
                variant="secondary"
                className="sm:ml-auto w-full sm:w-auto"
                onClick={handleChangePhotoClick}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Uploading…' : 'Change Photo'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input label="Email" type="email" defaultValue={user?.email} disabled />
              <Input
                label="Designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                disabled={!canEditDesignation}
              />
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-5 pt-4 border-t border-border">
              {profileStatus && (
                <p className={`text-xs ${statusClass(profileStatus.type)} sm:mr-auto`}>
                  {profileStatus.message}
                </p>
              )}
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Security" />
        <CardBody>
          <form onSubmit={handleUpdatePassword} className="space-y-4 sm:max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {passwordStatus && (
              <p className={`text-xs ${statusClass(passwordStatus.type)}`}>
                {passwordStatus.message}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={updatingPassword}
            >
              {updatingPassword ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
