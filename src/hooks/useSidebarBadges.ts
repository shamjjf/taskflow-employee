'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from './useSocket';
import { useAuthStore } from '@/store/authStore';
import { useRole } from './useRole';
import { employeeTasksService } from '@/modules/employee/tasks/services/employeeTasksService';
import { teamTasksService } from '@/modules/employee/team-tasks/services/teamTasksService';
import { approvalService } from '@/modules/employee/approval/services/approvalService';
import { notificationsService } from '@/modules/notifications/services/notificationsService';
import { chatService } from '@/modules/chat/services/chatService';

export interface SidebarBadges {
  myTasks: number;
  teamTasks: number;
  approveReports: number;
  chat: number;
  notifications: number;
}

interface ConversationLite {
  id: number;
  type?: string;
  participants?: Array<{ userId: number; lastReadAt?: string | null }>;
  messages?: Array<{ id: number; senderId?: number; createdAt: string }>;
}

// Reuses the same query keys the rest of the app uses (['my-tasks'],
// ['team-tasks'], ['pending-approvals'], ['notifications'], ['conversations'])
// so any mutation done elsewhere already refreshes the sidebar counts.
export function useSidebarBadges(): SidebarBadges {
  const queryClient = useQueryClient();
  const { isTeamLeader } = useRole();
  const currentUserId = useAuthStore((s) => s.user?.id);
  useSocket();

  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
  });

  const { data: teamTasks = [] } = useQuery({
    queryKey: ['team-tasks'],
    queryFn: () => teamTasksService.list(),
    enabled: isTeamLeader,
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => approvalService.listPending(),
    enabled: isTeamLeader,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.listConversations(),
  });

  const { data: notifUnread = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.unreadCount(),
  });

  const refreshTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
  }, [queryClient]);

  const refreshReports = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
  }, [queryClient]);

  const refreshNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const refreshConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient]);

  useSocketEvent('task:assigned', refreshTasks);
  useSocketEvent('task:started', refreshTasks);
  useSocketEvent('task:completed', refreshTasks);
  useSocketEvent('task:reviewed', refreshTasks);
  useSocketEvent('task:rejected', refreshTasks);
  useSocketEvent('report:submitted', refreshReports);
  useSocketEvent('report:approved', refreshReports);
  useSocketEvent('report:rejected', refreshReports);
  useSocketEvent('notification:new', refreshNotifications);
  useSocketEvent('message:new', refreshConversations);

  // Action-needed counts: tasks not yet completed; in_review tasks live in
  // the assignee's queue too (they need to act if rejected back).
  const myTasksCount = useMemo(
    () =>
      myTasks.filter((t) => t.status !== 'completed').length,
    [myTasks]
  );

  // For team leaders, the badge highlights work waiting on them — i.e. tasks
  // their team has submitted for review.
  const teamTasksCount = useMemo(
    () => teamTasks.filter((t) => t.status === 'in_review').length,
    [teamTasks]
  );

  // Count conversations with unread incoming messages (last msg newer than
  // this user's lastReadAt and authored by someone else).
  const chatUnreadCount = useMemo(() => {
    if (!currentUserId) return 0;
    return (conversations as unknown as ConversationLite[]).reduce((acc, conv) => {
      const lastMsg = conv.messages?.[0];
      if (!lastMsg) return acc;
      if (lastMsg.senderId === currentUserId) return acc;
      const me = conv.participants?.find((p) => p.userId === currentUserId);
      const lastReadAt = me?.lastReadAt ? new Date(me.lastReadAt).getTime() : 0;
      const lastMsgAt = new Date(lastMsg.createdAt).getTime();
      return lastMsgAt > lastReadAt ? acc + 1 : acc;
    }, 0);
  }, [conversations, currentUserId]);

  return {
    myTasks: myTasksCount,
    teamTasks: teamTasksCount,
    approveReports: pendingApprovals.length,
    chat: chatUnreadCount,
    notifications: notifUnread,
  };
}
