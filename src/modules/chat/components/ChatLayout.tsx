'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Avatar, Button, Modal } from '@/components/ui';
import { AttachmentChip } from '@/components/shared';
import { Search, Phone, Video, Paperclip, Send, Plus, Users, UsersRound, ArrowLeft } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { chatService } from '../services/chatService';
import { DepartmentGroupChatManager } from './DepartmentGroupChatManager';
import { uploadService, type UploadedFile } from '@/lib/uploadService';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAgoraCall } from '@/modules/calls/hooks/useAgoraCall';
import type { ApiResponse, Message } from '@/types';

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

interface DeptUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'team_leader' | 'employee' | 'admin';
  designation?: string;
}

interface ConversationParticipantDTO {
  userId: number;
  user?: { id: number; name: string; profileImage?: string };
}

interface ConversationDTO {
  id: number;
  type: 'direct' | 'group';
  name?: string | null;
  departmentId?: number | null;
  isAutoDepartmentGroup?: boolean;
  participants: ConversationParticipantDTO[];
  messages?: Array<{ id: number; message: string; createdAt: string }>;
}

export function ChatLayout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const convParam = searchParams.get('conv');
  const currentUser = useAuthStore((s) => s.user);
  const { startCall, status: callStatus } = useAgoraCall();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupChatManager, setShowGroupChatManager] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<number[]>([]);
  const [startingChatWithId, setStartingChatWithId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreateGroup =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'team_leader' ||
    (currentUser as unknown as { role?: string })?.role === 'admin';

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => (await chatService.listConversations()) as unknown as ConversationDTO[],
  });

  const { data: chatableUsers } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DeptUser[]>>('/users');
      return res.data;
    },
    enabled: showNewChatModal || showCreateGroupModal,
  });

  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    if (convParam) {
      const id = Number(convParam);
      if (!Number.isNaN(id) && conversations.some((c) => c.id === id)) {
        setActiveId(id);
        setMobileView('chat');
        router.replace('/chat');
      }
      // If the requested conv isn't in the list yet, wait for the refetch
      // to bring it in rather than falling back to the first conversation.
      return;
    }

    if (activeId === null) {
      // Preselect first conversation for desktop split view. Mobile stays on
      // the list — user must tap a chat to enter it (default messenger UX).
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId, convParam, router]);

  const openConversation = (id: number) => {
    setActiveId(id);
    setMobileView('chat');
  };

  const { data: messagesRaw } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => (activeId ? chatService.getMessages(activeId) : Promise.resolve([])),
    enabled: activeId !== null,
  });

  // Defensive: only render messages whose conversationId matches the active
  // chat. This prevents stale data from a previous chat from leaking through.
  const messages = useMemo(
    () => (messagesRaw || []).filter((m) => m.conversationId === activeId),
    [messagesRaw, activeId]
  );

  // ============ REAL-TIME SOCKET INTEGRATION ============
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;
    socketClient.connect(token);
  }, []);

  // Join conversation room when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    socketClient.emit('chat:join', activeId);
    return () => {
      socketClient.emit('chat:leave', activeId);
    };
  }, [activeId]);

  // Listen to incoming messages
  useEffect(() => {
    const handleNewMessage = (data: Message & { conversationId?: number }) => {
      const convId = (data as { conversationId?: number }).conversationId;
      if (convId && convId === activeId) {
        queryClient.setQueryData<Message[]>(['messages', convId], (old = []) => {
          if (old.some((m) => m.id === data.id)) return old;
          return [...old, data];
        });
      } else if (convId) {
        queryClient.invalidateQueries({ queryKey: ['messages', convId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socketClient.on('message:new', handleNewMessage);
    return () => {
      socketClient.off('message:new', handleNewMessage as (...args: unknown[]) => void);
    };
  }, [activeId, queryClient]);
  // =======================================================

  const getDisplayInfo = (conv: ConversationDTO) => {
    if (conv.type === 'group') {
      return {
        name: conv.name || 'Group chat',
        avatarColorId: conv.id + 1000,
        subtitle: `${conv.participants.length} members`,
      };
    }
    const other = conv.participants.find((p) => p.userId !== currentUser?.id);
    return {
      name: other?.user?.name || conv.name || 'Direct chat',
      avatarColorId: other?.user?.id || conv.id,
      subtitle: 'Direct message',
    };
  };

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!chatSearch.trim()) return conversations;
    const q = chatSearch.toLowerCase();
    return conversations.filter((c) => getDisplayInfo(c).name.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, chatSearch, currentUser?.id]);

  const activeConv = useMemo(
    () => conversations?.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  const filteredMembers = useMemo(() => {
    if (!chatableUsers) return [];
    const others = chatableUsers.filter((m) => m.id !== currentUser?.id);
    if (!memberSearch.trim()) return others;
    const q = memberSearch.toLowerCase();
    return others.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [chatableUsers, memberSearch, currentUser?.id]);

  const filteredGroupMembers = useMemo(() => {
    if (!chatableUsers) return [];
    const others = chatableUsers.filter((m) => m.id !== currentUser?.id);
    if (!groupSearch.trim()) return others;
    const q = groupSearch.toLowerCase();
    return others.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [chatableUsers, groupSearch, currentUser?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!showCreateGroupModal) {
      setGroupName('');
      setGroupSearch('');
      setSelectedGroupMemberIds([]);
    }
  }, [showCreateGroupModal]);

  const handleStartChat = async (member: DeptUser) => {
    setStartingChatWithId(member.id);
    try {
      const conv = await chatService.findOrCreateDirect(member.id, member.name);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      openConversation(conv.id);
      setShowNewChatModal(false);
      setMemberSearch('');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr?.response?.data?.error || 'Could not start chat.');
    } finally {
      setStartingChatWithId(null);
    }
  };

  const toggleGroupMember = (userId: number) => {
    setSelectedGroupMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const createGroupMutation = useMutation({
    mutationFn: () => {
      if (!groupName.trim()) throw new Error('Group name required');
      if (selectedGroupMemberIds.length < 1) throw new Error('Pick at least one member');
      return chatService.createGroup({
        name: groupName.trim(),
        participantIds: selectedGroupMemberIds,
        departmentId: currentUser?.departmentId ?? undefined,
      });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      openConversation(conversation.id);
      setShowCreateGroupModal(false);
    },
    onError: (err) => {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      alert(axiosErr?.response?.data?.error || axiosErr?.message || 'Could not create group');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const uploaded = await uploadService.uploadFile(file);
      setAttachment(uploaded);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUploadError(axiosErr?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !activeId || sending) return;
    setSending(true);
    try {
      const messageText = input.trim() || (attachment ? `📎 ${attachment.fileName}` : '');
      await chatService.sendMessage(activeId, messageText, attachment?.fileUrl);
      setInput('');
      setAttachment(null);
      setUploadError('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      alert(axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ============ CALL: derive other participant + start call ============
  const otherUser = useMemo(() => {
    if (!activeConv || activeConv.type !== 'direct') return null;
    const other = activeConv.participants.find((p) => p.userId !== currentUser?.id);
    return other?.user || null;
  }, [activeConv, currentUser?.id]);

  const handleStartCall = async (callType: 'audio' | 'video') => {
    if (!activeId || !activeConv) return;
    if (callStatus !== 'idle') {
      alert('You already have an active call.');
      return;
    }

    const isGroupCall = activeConv.type === 'group';

    let participants: { id: number; name: string; email?: string }[] = [];
    if (isGroupCall) {
      participants = activeConv.participants
        .filter((p) => p.userId !== currentUser?.id)
        .map((p) => ({
          id: p.userId,
          name: p.user?.name || `User ${p.userId}`,
        }));
      if (participants.length === 0) {
        alert('No one else is in this group to call.');
        return;
      }
    } else {
      if (!otherUser) {
        alert('Calls only work in direct (1-on-1) chats. Start a direct conversation first.');
        return;
      }
      participants = [
        {
          id: otherUser.id,
          name: otherUser.name,
          email: (otherUser as { email?: string }).email,
        },
      ];
    }

    try {
      await startCall({
        conversationId: activeId,
        callType,
        participants,
        isGroup: isGroupCall,
      });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      alert(
        axiosErr?.response?.data?.error ||
          axiosErr?.message ||
          'Could not start call. Please check your microphone/camera permissions.'
      );
    }
  };
  // =====================================================================

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[calc(100dvh-56px)] md:h-[calc(100vh-140px)] -mx-3 -my-4 sm:-mx-8 sm:-my-7 md:mx-0 md:my-0 bg-white border-0 md:border md:border-border md:rounded-lg overflow-hidden">
        <div
          className={cn(
            'border-border md:border-r flex-col min-h-0 overflow-hidden',
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          )}
        >
          <div className="p-3 border-b border-border space-y-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewChatModal(true)}
              className="w-full justify-center"
            >
              <Plus size={14} strokeWidth={2.5} />
              New Chat
            </Button>
            {canCreateGroup && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateGroupModal(true)}
                className="w-full justify-center"
              >
                <UsersRound size={14} strokeWidth={2.5} />
                New Group
              </Button>
            )}
            <div className="flex items-center gap-2 px-3 bg-surface-muted rounded-md h-9">
              <Search size={14} className="text-[#71717a]" />
              <input
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 bg-transparent border-none outline-none text-[13px]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="text-center py-8 text-sm text-[#71717a]">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-sm text-[#71717a]">
                {chatSearch ? (
                  'No chats match your search'
                ) : (
                  <>
                    <div className="mb-2">No conversations yet</div>
                    <div className="text-[12px]">
                      Click <strong>New Chat</strong> to message a teammate.
                    </div>
                  </>
                )}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activeId === c.id;
                const info = getDisplayInfo(c);
                return (
                  <div
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={cn(
                      'flex gap-2.5 px-3.5 py-3 border-b border-border cursor-pointer transition-colors',
                      isActive ? 'bg-primary-soft' : 'hover:bg-surface-muted'
                    )}
                  >
                    <Avatar initials={getInitials(info.name)} color={colorForId(info.avatarColorId)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{info.name}</div>
                      <div className="text-xs text-[#71717a] truncate mt-0.5">
                        {info.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex-col min-h-0 overflow-hidden',
            mobileView === 'chat' ? 'flex' : 'hidden md:flex'
          )}
        >
          <div className="px-4 md:px-5 py-3 md:py-3.5 border-b border-border flex items-center gap-2.5">
            {activeConv ? (
              <>
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden -ml-1 w-9 h-9 rounded-md flex items-center justify-center text-[#52525b] hover:bg-surface-muted"
                  aria-label="Back to chats"
                >
                  <ArrowLeft size={18} />
                </button>
                {(() => {
                  const info = getDisplayInfo(activeConv);
                  return (
                    <>
                      <Avatar
                        initials={getInitials(info.name)}
                        color={colorForId(info.avatarColorId)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{info.name}</div>
                        <div className="text-[11.5px] text-[#71717a] truncate">{info.subtitle}</div>
                      </div>
                    </>
                  );
                })()}
                <div className="ml-auto flex gap-1 md:gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartCall('audio')}
                    disabled={callStatus !== 'idle'}
                    className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      activeConv.type === 'group' ? 'Group voice call' : 'Audio call'
                    }
                  >
                    <Phone size={16} />
                  </button>
                  <button
                    onClick={() => handleStartCall('video')}
                    disabled={callStatus !== 'idle'}
                    className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      activeConv.type === 'group' ? 'Group video call' : 'Video call'
                    }
                  >
                    <Video size={16} />
                  </button>
                  {activeConv.type === 'group' && (
                    <button
                      onClick={() => setShowGroupChatManager(true)}
                      className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b]"
                      title="Manage members"
                    >
                      <Users size={16} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-[#71717a]">Select a conversation</div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 md:p-5 flex flex-col gap-3">
            {!activeId ? (
              <div className="text-center py-12 text-sm text-[#71717a]">
                Choose a chat to start messaging, or click <strong>New Chat</strong> to start one.
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#71717a]">
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map((m) => {
                const sender = (m as unknown as { sender?: { id: number; name: string } }).sender;
                const isOutgoing = sender?.id === currentUser?.id;
                const attachmentUrl = (m as unknown as { attachmentUrl?: string }).attachmentUrl;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex gap-2 max-w-[85%] md:max-w-[70%]',
                      isOutgoing ? 'self-end flex-row-reverse' : ''
                    )}
                  >
                    {!isOutgoing && sender && (
                      <Avatar initials={getInitials(sender.name)} color={colorForId(sender.id)} />
                    )}
                    <div>
                      {!isOutgoing && sender && activeConv?.type === 'group' && (
                        <div className="text-[11px] text-[#71717a] mb-0.5 ml-1">
                          {sender.name}
                        </div>
                      )}
                      {m.message && (
                        <div
                          className={cn(
                            'px-3 py-2 rounded-xl text-[13.5px] leading-relaxed',
                            isOutgoing ? 'bg-primary text-white' : 'bg-surface-muted'
                          )}
                        >
                          {m.message}
                        </div>
                      )}
                      {attachmentUrl && (
                        <div className={cn('mt-1', isOutgoing ? 'flex justify-end' : '')}>
                          <AttachmentChip fileUrl={attachmentUrl} />
                        </div>
                      )}
                      <div
                        className={cn(
                          'text-[11px] text-[#a1a1aa] mt-1',
                          isOutgoing ? 'text-right' : 'text-left'
                        )}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {activeId && (
            <div className="px-3 md:px-5 py-2.5 md:py-3 border-t border-border">
              {attachment && (
                <div className="mb-2">
                  <AttachmentChip
                    fileUrl={attachment.fileUrl}
                    fileName={attachment.fileName}
                    fileType={attachment.fileType}
                    fileSize={attachment.fileSize}
                    onRemove={() => setAttachment(null)}
                  />
                </div>
              )}

              {uploadError && <div className="mb-2 text-xs text-danger">{uploadError}</div>}

              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !!attachment}
                  className="w-[38px] h-[38px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] transition-colors disabled:opacity-40"
                  title="Attach file"
                >
                  <Paperclip size={16} />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={uploading ? 'Uploading...' : 'Type a message...'}
                  disabled={sending || uploading}
                  className="flex-1 min-w-0 px-3 py-2 border border-border rounded-md outline-none focus:border-primary text-[14px]"
                />
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={sending || uploading || (!input.trim() && !attachment)}
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showNewChatModal}
        onClose={() => {
          setShowNewChatModal(false);
          setMemberSearch('');
        }}
        title="Start New Chat"
        footer={
          <Button variant="secondary" onClick={() => setShowNewChatModal(false)}>
            Cancel
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="text-[12.5px] text-[#71717a]">
            Select someone from the organisation to start chatting.
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
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#71717a]">
                {memberSearch ? 'No members match your search' : 'No teammates available'}
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleStartChat(member)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors',
                    startingChatWithId === member.id ? 'bg-primary-soft' : 'hover:bg-surface-muted'
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
                  {startingChatWithId === member.id && (
                    <span className="text-[11.5px] text-primary">Opening...</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="Create Group Chat"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreateGroupModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createGroupMutation.mutate()}
              disabled={
                createGroupMutation.isPending ||
                !groupName.trim() ||
                selectedGroupMemberIds.length === 0
              }
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create group'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12.5px] font-medium text-[#52525b] mb-1">
              Group name
            </label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Q4 Launch Team"
              className="w-full px-3 py-2 border border-border rounded-md outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12.5px] font-medium text-[#52525b]">
                Add members ({selectedGroupMemberIds.length} selected)
              </label>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md mb-2">
              <Search size={14} className="text-[#71717a]" />
              <input
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search teammates..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto border border-border rounded-md">
              {filteredGroupMembers.length === 0 ? (
                <div className="text-center py-6 text-sm text-[#71717a]">
                  No teammates available
                </div>
              ) : (
                filteredGroupMembers.map((member) => {
                  const checked = selectedGroupMemberIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors',
                        checked ? 'bg-primary-soft' : 'hover:bg-surface-muted'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGroupMember(member.id)}
                        className="cursor-pointer"
                      />
                      <Avatar
                        initials={getInitials(member.name)}
                        color={colorForId(member.id)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{member.name}</div>
                        <div className="text-[11.5px] text-[#71717a] truncate">
                          {member.role === 'team_leader'
                            ? 'Team Leader'
                            : member.designation || 'Employee'}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      {activeConv && activeConv.type === 'group' && (
        <DepartmentGroupChatManager
          conversationId={activeConv.id}
          departmentId={activeConv.departmentId || currentUser?.departmentId || 0}
          isOpen={showGroupChatManager}
          onClose={() => setShowGroupChatManager(false)}
        />
      )}
    </>
  );
}
