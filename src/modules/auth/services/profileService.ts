import { api } from '@/lib/api';
import type { User, ApiResponse } from '@/types';

export interface UpdateProfilePayload {
  name?: string;
  designation?: string;
  phone?: string;
  profileImage?: string;
}

export const profileService = {
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await api.put<ApiResponse<User>>('/users/me/profile', payload);
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};
