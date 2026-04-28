'use client';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { NotificationsList } from '@/modules/notifications/components/NotificationsList';

export default function EmployeeNotificationsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle="Updates on your tasks, reports, and messages"
        action={<Button variant="secondary">Mark all as read</Button>}
      />
      <NotificationsList />
    </div>
  );
}
