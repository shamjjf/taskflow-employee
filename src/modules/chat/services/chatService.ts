import { api } from '@/lib/api';
import type { Conversation, Message, ApiResponse } from '@/types';

export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    const res = await api.get<ApiResponse<Conversation[]>>('/conversations');
    return res.data;
  },

  async createConversation(data: {
    type: 'direct' | 'group';
    name?: string;
    participantIds: number[];
    departmentId?: number;
  }) {
    const res = await api.post<ApiResponse<Conversation>>('/conversations', data);
    return res.data;
  },

  // Find an existing direct conversation with a user, or create a new one
  async findOrCreateDirect(targetUserId: number, targetUserName: string): Promise<Conversation> {
    // First, try to find an existing direct conversation that has exactly these 2 participants
    const conversations = await this.listConversations();

    const existing = conversations.find((c) => {
      if (c.type !== 'direct') return false;
      const participants =
        (c as unknown as { participants?: Array<{ userId: number }> }).participants || [];
      const userIds = participants.map((p) => p.userId);
      return userIds.includes(targetUserId) && userIds.length === 2;
    });

    if (existing) return existing;

    // Otherwise create a new direct conversation
    return this.createConversation({
      type: 'direct',
      name: targetUserName,
      participantIds: [targetUserId],
    });
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const res = await api.get<ApiResponse<Message[]>>(`/conversations/${conversationId}/messages`);
    return res.data;
  },

  async sendMessage(conversationId: number, message: string, attachmentUrl?: string) {
    const res = await api.post<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, {
      message,
      attachmentUrl,
    });
    return res.data;
  },

  async markRead(conversationId: number) {
    await api.put(`/conversations/${conversationId}/read`);
  },
};
