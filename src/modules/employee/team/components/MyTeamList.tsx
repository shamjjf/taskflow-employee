'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, Avatar, Badge, Button } from '@/components/ui';
import { MessageSquare, Mail, BarChart3, TrendingUp, Plus, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { useRole } from '@/hooks/useRole';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLE_LABELS } from '@/constants';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { chatService } from '@/modules/chat/services/chatService';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { EditTeamMemberModal } from './EditTeamMemberModal';
import type { ApiResponse } from '@/types';

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

interface DeptUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'team_leader' | 'employee';
  designation?: string;
  profileImage?: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
}

export function MyTeamList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isTeamLeader } = useRole();
  const currentUser = useAuthStore((s) => s.user);
  const [startingChatWithId, setStartingChatWithId] = useState<number | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DeptUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['department-members', currentUser?.departmentId],
    queryFn: async () => {
      if (!currentUser?.departmentId) return [];
      const res = await api.get<ApiResponse<DeptUser[]>>(
        `/departments/${currentUser.departmentId}/members`
      );
      return res.data;
    },
    enabled: !!currentUser?.departmentId,
  });

  const startChat = async (member: DeptUser) => {
    if (member.id === currentUser?.id) return;
    setStartingChatWithId(member.id);
    try {
      const conv = await chatService.findOrCreateDirect(member.id, member.name);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/chat?conv=${conv.id}`);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr?.response?.data?.error || 'Could not start chat. Please try again.');
    } finally {
      setStartingChatWithId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-[#71717a]">Loading team...</div>;
  }

  const members = data || [];
  const teamLeader = members.find((u) => u.role === 'team_leader');
  const teamMembers = members.filter((u) => u.role === 'employee');

  return (
    <div className="space-y-6">
      {teamLeader && !isTeamLeader && teamLeader.id !== currentUser?.id && (
        <div>
          <h2 className="text-[13px] text-[#71717a] uppercase tracking-wider font-medium mb-3">
            Team Leader
          </h2>
          <Card>
            <CardBody className="py-3 sm:py-4 px-3 sm:px-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Avatar
                  initials={getInitials(teamLeader.name)}
                  color={colorForId(teamLeader.id)}
                  src={teamLeader.profileImage}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                    <span className="text-[14px] sm:text-[15px] font-semibold truncate">
                      {teamLeader.name}
                    </span>
                    <Badge variant="purple">{USER_ROLE_LABELS[teamLeader.role]}</Badge>
                  </div>
                  <div className="text-[12px] sm:text-[13px] text-[#71717a] truncate">
                    {teamLeader.email}
                  </div>
                  {teamLeader.lastLoginAt && (
                    <div className="text-[11px] sm:text-[11.5px] text-[#71717a] mt-0.5">
                      Active {formatRelativeTime(teamLeader.lastLoginAt)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => startChat(teamLeader)}
                    disabled={startingChatWithId === teamLeader.id}
                  >
                    <MessageSquare size={12} />
                    <span className="hidden sm:inline">
                      {startingChatWithId === teamLeader.id ? 'Opening...' : 'Message'}
                    </span>
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h2 className="text-[13px] text-[#71717a] uppercase tracking-wider font-medium">
            {isTeamLeader
              ? `My Team Members (${teamMembers.length})`
              : `Team Members (${teamMembers.length})`}
          </h2>
          {isTeamLeader && (
            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddMemberOpen(true)}
              >
                <Plus size={12} strokeWidth={2.5} />
                Add Member
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/team/performance')}
              >
                <BarChart3 size={12} />
                View Performance
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          {teamMembers.map((member) => {
            const isMe = member.id === currentUser?.id;
            return (
              <Card key={member.id}>
                <CardBody className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Avatar
                      initials={getInitials(member.name)}
                      color={colorForId(member.id)}
                      src={member.profileImage}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] sm:text-[14px] font-semibold truncate flex items-center gap-2">
                        <span className="truncate">{member.name}</span>
                        {isMe && (
                          <span className="text-[10.5px] text-primary bg-primary-soft px-1.5 py-0.5 rounded shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11.5px] sm:text-[12px] text-[#71717a] truncate">
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                        <Badge variant={member.status === 'active' ? 'success' : 'neutral'}>
                          {member.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                        {member.lastLoginAt && (
                          <span className="text-[10.5px] sm:text-[11px] text-[#71717a]">
                            {formatRelativeTime(member.lastLoginAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isMe && (
                      <div className="flex gap-1 sm:gap-1.5 shrink-0">
                        {isTeamLeader && (
                          <button
                            onClick={() => setEditingMember(member)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-[#71717a] bg-surface-muted hover:bg-[#e4e4e7] hover:text-[#18181b] transition-colors"
                            title="Edit member"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {isTeamLeader && (
                          <button
                            onClick={() => router.push(`/team/performance/${member.id}`)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-[#71717a] bg-surface-muted hover:bg-[#e4e4e7] hover:text-[#18181b] transition-colors"
                            title="View performance"
                          >
                            <TrendingUp size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => startChat(member)}
                          disabled={startingChatWithId === member.id}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-primary bg-primary-soft hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                          title="Start chat"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <a
                          href={`mailto:${member.email}`}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-[#71717a] bg-surface-muted hover:bg-[#e4e4e7] hover:text-[#18181b] transition-colors"
                          title="Email"
                        >
                          <Mail size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {isTeamLeader && (
        <>
          <AddTeamMemberModal
            isOpen={isAddMemberOpen}
            onClose={() => setIsAddMemberOpen(false)}
          />
          <EditTeamMemberModal
            isOpen={editingMember !== null}
            onClose={() => setEditingMember(null)}
            member={editingMember}
          />
        </>
      )}

      <div className="p-3 bg-info-soft rounded-md text-[12.5px] text-info leading-relaxed">
        {isTeamLeader ? (
          <>
            <strong>As Team Leader:</strong> You can chat with any member of your department,
            assign tasks to them, and approve/reject their reports. Cross-department coordination
            goes through the Super Admin.
          </>
        ) : (
          <>
            <strong>Note:</strong> Click the message icon to start a direct chat with anyone in
            your department. To connect with other departments, request through your Team Leader.
          </>
        )}
      </div>
    </div>
  );
}
