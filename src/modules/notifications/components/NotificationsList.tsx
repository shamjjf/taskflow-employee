'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui';
import { FilterBar, FilterSelect } from '@/components/shared';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Check, ClipboardList, AlertTriangle, MessageSquare, FileText } from 'lucide-react';
import { notificationsService } from '../services/notificationsService';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
  task_assigned: { Icon: ClipboardList, color: '#3b82f6', bg: '#eff6ff' },
  task_started: { Icon: ClipboardList, color: '#3b82f6', bg: '#eff6ff' },
  task_completed: { Icon: Check, color: '#10b981', bg: '#ecfdf5' },
  task_overdue: { Icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
  deadline_near: { Icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb' },
  report_submitted: { Icon: FileText, color: '#f59e0b', bg: '#fffbeb' },
  report_approved: { Icon: Check, color: '#10b981', bg: '#ecfdf5' },
  report_rejected: { Icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
  message_new: { Icon: MessageSquare, color: '#8b5cf6', bg: '#f5f3ff' },
  comment_new: { Icon: MessageSquare, color: '#8b5cf6', bg: '#f5f3ff' },
  system: { Icon: AlertTriangle, color: '#64748b', bg: '#f1f5f9' },
};

export function NotificationsList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
  });

  const handleClick = async (id: number, isRead: boolean) => {
    if (isRead) return;
    await notificationsService.markRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const notifications = data || [];

  return (
    <>
      <FilterBar>
        <FilterSelect
          options={[
            { value: '', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'tasks', label: 'Tasks' },
            { value: 'reports', label: 'Reports' },
            { value: 'messages', label: 'Messages' },
          ]}
        />
      </FilterBar>
      <Card>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-[#71717a]">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#71717a]">No notifications yet</div>
        ) : (
          <div>
            {notifications.map((n) => {
              const meta = iconMap[n.type] || iconMap.system;
              const Icon = meta.Icon;
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n.id, n.isRead)}
                  className={cn(
                    'flex gap-3 px-5 py-3.5 border-b border-border last:border-b-0 cursor-pointer transition-colors',
                    n.isRead ? 'hover:bg-surface-muted' : 'bg-primary-soft hover:bg-[#e4e4fa]'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium mb-0.5">{n.title}</div>
                    <div className="text-[12.5px] text-[#71717a]">{n.message}</div>
                    <div className="text-[11.5px] text-[#a1a1aa] mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
