'use client';

import { PageHeader } from '@/components/layout';
import { Card, CardHeader, CardBody, Avatar, Input, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Profile" subtitle="Manage your personal information" />

      <Card className="mb-4">
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar
                initials={user?.initials || 'U'}
                color={user?.color}
                size="lg"
                className="w-16 h-16 text-lg shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[18px] font-semibold truncate">{user?.name}</div>
                <div className="text-[13px] text-[#71717a] truncate">{user?.designation}</div>
                <div className="text-[12px] text-[#71717a] mt-1 truncate">
                  {user?.departmentName} Department
                </div>
              </div>
            </div>
            <Button variant="secondary" className="sm:ml-auto w-full sm:w-auto">
              Change Photo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue={user?.name} />
            <Input label="Email" type="email" defaultValue={user?.email} disabled />
            <Input label="Designation" defaultValue={user?.designation} />
            <Input label="Phone Number" placeholder="+91 98765 43210" />
          </div>

          <div className="flex justify-stretch sm:justify-end mt-5 pt-4 border-t border-border">
            <Button variant="primary" className="w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Security" />
        <CardBody>
          <div className="space-y-4 sm:max-w-md">
            <Input label="Current Password" type="password" />
            <Input label="New Password" type="password" />
            <Input label="Confirm New Password" type="password" />
            <Button variant="primary" className="w-full sm:w-auto">
              Update Password
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
