'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRole } from '@/hooks/useRole';
import { notificationsService } from '@/modules/notifications/services/notificationsService';
import { ProfileMenu } from './ProfileMenu';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/my-tasks': 'My Tasks',
  '/my-reports': 'My Reports',
  '/submit-report': 'Submit Report',
  '/team': 'My Team',
  '/team-tasks': 'Team Tasks',
  '/approve-reports': 'Approve Reports',
  '/chat': 'Chat',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
};

export function EmployeeTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isTeamLeader } = useRole();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 30000,
  });

  let pageTitle = pageTitles[pathname] || 'Dashboard';
  if (pathname.startsWith('/task/')) pageTitle = 'Task Detail';

  const searchPlaceholder = isTeamLeader ? 'Search tasks, team...' : 'Search my tasks...';

  return (
    <div className="h-14 bg-white border-b border-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10">
      <div className="hidden md:flex items-center gap-2 text-[13px] text-[#71717a]">
        <span>{user?.departmentName || 'Development'}</span>
        <span className="text-[#a1a1aa]">/</span>
        <strong className="text-[#18181b] font-medium">{pageTitle}</strong>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 bg-surface-muted rounded-md h-[34px] w-64 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-soft transition-all">
          <Search size={14} className="text-[#71717a] shrink-0" />
          <input
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-[13px]"
          />
        </div>
        <button
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Open search"
          className="md:hidden w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] transition-colors"
        >
          <Search size={18} />
        </button>
        <button
          onClick={() => router.push('/notifications')}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] transition-colors relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-white" />
          )}
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <ProfileMenu />
      </div>

      {mobileSearchOpen && (
        <div className="md:hidden absolute inset-0 bg-white px-4 flex items-center gap-2 border-b border-border z-20">
          <div className="flex-1 flex items-center gap-2 px-3 bg-surface-muted rounded-md h-[34px] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-soft transition-all">
            <Search size={14} className="text-[#71717a] shrink-0" />
            <input
              autoFocus
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent border-none outline-none text-[13px]"
            />
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
            className="w-[34px] h-[34px] shrink-0 rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
