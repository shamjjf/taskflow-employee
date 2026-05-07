'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Modal } from '@/components/ui';
import { X, Plus, Search, Trash2 } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { chatService } from '../services/chatService';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface GroupChatMember {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    designation?: string;
    profileImage?: string;
  };
  joinedAt: string;
}

interface DeptUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'team_leader' | 'employee';
  designation?: string;
}

interface DepartmentGroupChatManagerProps {
  conversationId: number;
  departmentId: number;
  isOpen: boolean;
  onClose: () => void;
}

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

export function DepartmentGroupChatManager({
  conversationId,
  departmentId,
  isOpen,
  onClose,
}: DepartmentGroupChatManagerProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // Get current group members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['groupMembers', conversationId],
    queryFn: () => chatService.getDepartmentGroupMembers(conversationId),
    enabled: isOpen,
  });

  // Get all department members
  const { data: departmentMembers = [] } = useQuery({
    queryKey: ['departmentMembersForGroup', departmentId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DeptUser[]>>(`/departments/${departmentId}/members`);
      return res.data;
    },
    enabled: isOpen && showAddMember,
  });

  // Filter members not yet in the group
  const availableMembers = departmentMembers.filter(
    (member) => !members.some((m) => m.userId === member.id)
  );

  const filteredAvailableMembers = availableMembers.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      chatService.addMemberToDepartmentGroup(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', conversationId] });
      setMemberSearch('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      chatService.removeMemberFromDepartmentGroup(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', conversationId] });
    },
  });

  const isAdminOrTeamLead =
    currentUser?.role === 'super_admin' ||
    (currentUser?.role === 'team_leader' && currentUser?.departmentId === departmentId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Department Group Chat Members">
      <div className="space-y-4">
        {/* Current Members List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Members ({members.length})</h3>
            {isAdminOrTeamLead && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddMember(true)}
                disabled={availableMembers.length === 0}
              >
                <Plus size={14} />
                Add Member
              </Button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
            {loadingMembers ? (
              <div className="text-center py-8 text-sm text-[#71717a]">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#71717a]">No members yet</div>
            ) : (
              members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0"
                >
                  <Avatar
                    initials={getInitials(member.user.name)}
                    color={colorForId(member.user.id)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{member.user.name}</div>
                    <div className="text-[11.5px] text-[#71717a] truncate">
                      {member.user.role === 'team_leader' ? 'Team Leader' : 'Member'}
                    </div>
                  </div>
                  {isAdminOrTeamLead && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.userId)}
                      disabled={removeMemberMutation.isPending}
                      className="p-1.5 text-[#71717a] hover:text-danger hover:bg-danger-soft rounded transition-colors disabled:opacity-40"
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <Modal
            isOpen={true}
            onClose={() => setShowAddMember(false)}
            title="Add Members to Group"
            footer={
              <Button variant="secondary" onClick={() => setShowAddMember(false)}>
                Done
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="text-[12.5px] text-[#71717a]">
                Select teammates to add to the department group chat.
              </div>
              <div className="flex items-center gap-2 px-3 bg-surface-muted rounded-md h-9">
                <Search size={14} className="text-[#71717a]" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-[13px]"
                />
              </div>
              <div className="max-h-[320px] overflow-y-auto border border-border rounded-md">
                {filteredAvailableMembers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#71717a]">
                    {memberSearch
                      ? 'No members match your search'
                      : 'All members are already in the group'}
                  </div>
                ) : (
                  filteredAvailableMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => {
                        addMemberMutation.mutate(member.id);
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors',
                        addMemberMutation.isPending ? 'opacity-50' : 'hover:bg-surface-muted'
                      )}
                    >
                      <Avatar
                        initials={getInitials(member.name)}
                        color={colorForId(member.id)}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{member.name}</div>
                        <div className="text-[11.5px] text-[#71717a] truncate">
                          {member.role === 'team_leader' ? 'Team Leader' : member.designation || 'Employee'}
                        </div>
                      </div>
                      {addMemberMutation.isPending && (
                        <span className="text-[11.5px] text-primary">Adding...</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
}
