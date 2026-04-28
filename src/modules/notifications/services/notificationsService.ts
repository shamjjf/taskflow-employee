import { api } from '@/lib/api';
import type { Notification, ApiResponse } from '@/types';

export const notificationsService = {
  async list(): Promise<Notification[]> {
    const res = await api.get<ApiResponse<Notification[]>>('/notifications');
    return res.data;
  },

  async unreadCount(): Promise<number> {
    const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.count;
  },

  async markRead(id: number) {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllRead() {
    await api.put('/notifications/read-all');
  },
};
