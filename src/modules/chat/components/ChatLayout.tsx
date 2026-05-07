'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Modal } from '@/components/ui';
import { AttachmentChip } from '@/components/shared';
import { Search, Phone, Video, Paperclip, Send, Plus, Users } from 'lucide-react';
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
  role: 'super_admin' | 'team_leader' | 'employee';
  designation?: string;
}

export function ChatLayout() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { startCall, status: callStatus } = useAgoraCall();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupChatManager, setShowGroupChatManager] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [startingChatWithId, setStartingChatWithId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.listConversations(),
  });

  const { data: departmentGroupChat } = useQuery({
    queryKey: ['departmentGroupChat', currentUser?.departmentId],
    queryFn: async () => {
      if (!currentUser?.departmentId) return null;
      return chatService.getDepartmentGroupChat(currentUser.departmentId);
    },
    enabled: !!currentUser?.departmentId,
  });

  const { data: departmentMembers } = useQuery({
    queryKey: ['department-members', currentUser?.departmentId],
    queryFn: async () => {
      if (!currentUser?.departmentId) return [];
      const res = await api.get<ApiResponse<DeptUser[]>>(
        `/departments/${currentUser.departmentId}/members`
      );
      return res.data;
    },
    enabled: showNewChatModal && !!currentUser?.departmentId,
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && activeId === null) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const { data: messages } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => (activeId ? chatService.getMessages(activeId) : Promise.resolve([])),
    enabled: activeId !== null,
  });

  // ============ REAL-TIME SOCKET INTEGRATION ============
  // Connect socket on mount + ensure connection
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;
    const socket = socketClient.connect(token);
    return () => {
      // Don't disconnect on unmount — keep socket alive across pages
    };
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
      // If the message arrives for the currently open conversation,
      // optimistically update the messages cache so the UI shows it instantly.
      if (convId && convId === activeId) {
        queryClient.setQueryData<Message[]>(['messages', convId], (old = []) => {
          // Avoid duplicates if the sender already added it locally
          if (old.some((m) => m.id === data.id)) return old;
          return [...old, data];
        });
      } else if (convId) {
        // Background conversation: just refetch its messages and update conv list
        queryClient.invalidateQueries({ queryKey: ['messages', convId] });
      }
      // Always refresh conversation list so latest message preview updates
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socketClient.on('message:new', handleNewMessage);
    return () => {
      socketClient.off('message:new', handleNewMessage as (...args: unknown[]) => void);
    };
  }, [activeId, queryClient]);
  // =======================================================

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!chatSearch.trim()) return conversations;
    const q = chatSearch.toLowerCase();
    return conversations.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [conversations, chatSearch]);

  const activeConv = useMemo(
    () => conversations?.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  const filteredMembers = useMemo(() => {
    if (!departmentMembers) return [];
    const others = departmentMembers.filter((m) => m.id !== currentUser?.id);
    if (!memberSearch.trim()) return others;
    const q = memberSearch.toLowerCase();
    return others.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [departmentMembers, memberSearch, currentUser?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartChat = async (member: DeptUser) => {
    setStartingChatWithId(member.id);
    try {
      const conv = await chatService.findOrCreateDirect(member.id, member.name);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveId(conv.id);
      setShowNewChatModal(false);
      setMemberSearch('');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr?.response?.data?.error || 'Could not start chat.');
    } finally {
      setStartingChatWithId(null);
    }
  };

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
      // Socket will deliver the message back via 'message:new' event,
      // but invalidate conversations to update the sidebar preview.
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } finally {
      setSending(false);
    }
  };

  // ============ CALL: derive other participant + start call ============
  const otherUser = useMemo(() => {
    if (!activeConv || activeConv.type !== 'direct') return null;
    const participants =
      (activeConv as unknown as {
        participants?: Array<{ userId: number; user?: { id: number; name: string; email?: string } }>;
      }).participants || [];
    const other = participants.find((p) => p.userId !== currentUser?.id);
    return other?.user || null;
  }, [activeConv, currentUser?.id]);

  const handleStartCall = async (callType: 'audio' | 'video') => {
    if (!activeId || !activeConv) return;
    if (!otherUser) {
      alert('Calls only work in direct (1-on-1) chats. Start a direct conversation first.');
      return;
    }
    if (callStatus !== 'idle') {
      alert('You already have an active call.');
      return;
    }
    try {
      await startCall({
        conversationId: activeId,
        callType,
        participants: [
          {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
          },
        ],
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
      <div className="grid grid-cols-[280px_1fr] h-[calc(100vh-140px)] bg-white border border-border rounded-lg overflow-hidden">
        <div className="border-r border-border flex flex-col">
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
                const displayName = c.name || (c.type === 'direct' ? 'Direct' : 'Group');
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      'flex gap-2.5 px-3.5 py-3 border-b border-border cursor-pointer transition-colors',
                      isActive ? 'bg-primary-soft' : 'hover:bg-surface-muted'
                    )}
                  >
                    <Avatar initials={getInitials(displayName)} color={colorForId(c.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{displayName}</div>
                      <div className="text-xs text-[#71717a] truncate mt-0.5">
                        {c.type === 'direct' ? 'Direct message' : 'Group chat'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
            {activeConv ? (
              <>
                <Avatar
                  initials={getInitials(activeConv.name || 'C')}
                  color={colorForId(activeConv.id)}
                />
                <div>
                  <div className="font-medium text-sm">{activeConv.name || 'Conversation'}</div>
                  <div className="text-[11.5px] text-success">● Active</div>
                </div>
                <div className="ml-auto flex gap-1.5">
                  {activeConv.type === 'group' ? (
                    <button
                      onClick={() => setShowGroupChatManager(true)}
                      disabled={!departmentGroupChat || activeId !== departmentGroupChat.id}
                      className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Manage members"
                    >
                      <Users size={16} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartCall('audio')}
                        disabled={!otherUser || callStatus !== 'idle'}
                        className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] disabled:opacity-40 disabled:cursor-not-allowed"
                        title={otherUser ? 'Audio call' : 'Audio call (only in direct chats)'}
                      >
                        <Phone size={16} />
                      </button>
                      <button
                        onClick={() => handleStartCall('video')}
                        disabled={!otherUser || callStatus !== 'idle'}
                        className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] disabled:opacity-40 disabled:cursor-not-allowed"
                        title={otherUser ? 'Video call' : 'Video call (only in direct chats)'}
                      >
                        <Video size={16} />
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-[#71717a]">Select a conversation</div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
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
                      'flex gap-2 max-w-[70%]',
                      isOutgoing ? 'self-end flex-row-reverse' : ''
                    )}
                  >
                    {!isOutgoing && sender && (
                      <Avatar initials={getInitials(sender.name)} color={colorForId(sender.id)} />
                    )}
                    <div>
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
            <div className="px-5 py-3 border-t border-border">
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
                  className="flex-1 px-3 py-2 border border-border rounded-md outline-none focus:border-primary"
                />
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={sending || uploading || (!input.trim() && !attachment)}
                >
                  <Send size={14} />
                  {sending ? 'Sending...' : 'Send'}
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
            Select a teammate from your department to start chatting.
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

      {departmentGroupChat && (
        <DepartmentGroupChatManager
          conversationId={departmentGroupChat.id}
          departmentId={currentUser?.departmentId || 0}
          isOpen={showGroupChatManager}
          onClose={() => setShowGroupChatManager(false)}
        />
      )}
    </>
  );
}
