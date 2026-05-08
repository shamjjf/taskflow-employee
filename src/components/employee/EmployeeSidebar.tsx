'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useRole } from '@/hooks/useRole';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  FilePlus,
  Users,
  MessageSquare,
  Bell,
  User,
  UserCheck,
  CheckSquare,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
  badge?: number;
}

export function EmployeeSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { isTeamLeader } = useRole();
  const badges = useSidebarBadges();

  const navSections: { title: string; items: NavItem[]; visible?: boolean }[] = [
    {
      title: 'My Work',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/my-tasks', label: 'My Tasks', icon: ClipboardList, badge: badges.myTasks },
        { href: '/my-reports', label: 'My Reports', icon: FileText },
        { href: '/submit-report', label: 'Submit Report', icon: FilePlus },
      ],
    },
    {
      title: 'Team Management',
      visible: isTeamLeader,
      items: [
        { href: '/team-tasks', label: 'Team Tasks', icon: CheckSquare, badge: badges.teamTasks },
        { href: '/approve-reports', label: 'Approve Reports', icon: UserCheck, badge: badges.approveReports },
      ],
    },
    {
      title: 'Team',
      items: [
        { href: '/team', label: 'My Team', icon: Users },
        { href: '/chat', label: 'Chat', icon: MessageSquare, badge: badges.chat },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/notifications', label: 'Notifications', icon: Bell, badge: badges.notifications },
        { href: '/profile', label: 'Profile', icon: User },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-border flex flex-col fixed h-screen overflow-y-auto">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm">
          T
        </div>
        <div className="text-[15px] font-semibold tracking-tight">TaskFlow</div>
      </div>
      <div className="px-5 py-3 border-b border-border">
        <div className="text-[11px] text-[#a1a1aa] uppercase tracking-wider font-medium mb-1">
          Department
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-medium">{user?.departmentName || 'Development'}</div>
          {isTeamLeader && <Badge variant="purple" withDot={false}>TL</Badge>}
        </div>
      </div>
      <nav className="p-3 flex-1">
        {navSections.filter((s) => s.visible !== false).map((section) => (
          <div key={section.title}>
            <div className="px-2 py-2 text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium mt-2">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13.5px] font-medium transition-all mb-0.5',
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-[#71717a] hover:bg-surface-muted hover:text-[#18181b]'
                  )}
                >
                  <Icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[11px] px-1.5 py-0.5 rounded-full font-medium',
                        isActive ? 'bg-white text-primary' : 'bg-surface-muted text-[#71717a]'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
