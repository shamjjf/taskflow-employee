'use client';

import { PageHeader } from '@/components/layout';
import { ChatLayout } from '@/modules/chat/components/ChatLayout';

export default function EmployeeChatPage() {
  return (
    <div className="animate-fade-in">
      <div className="hidden md:block">
        <PageHeader
          title="Messages"
          subtitle="Chat with your team members. Only people from your department are visible."
        />
      </div>
      <ChatLayout />
    </div>
  );
}
