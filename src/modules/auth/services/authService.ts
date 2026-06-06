import { api } from '@/lib/api';
import type { User, ApiResponse } from '@/types';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string, orgSlug?: string): Promise<LoginResponse> {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
      ...(orgSlug ? { orgSlug } : {}),
    });
    return res.data;
  },

  // Public — populates the login-screen org dropdown so users pick which
  // tenant they're signing into before subdomains are wired up.
  async listOrganizations(): Promise<{ id: number; slug: string; name: string }[]> {
    const res = await api.get<ApiResponse<{ id: number; slug: string; name: string }[]>>(
      '/organizations/public'
    );
    return res.data || [];
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh-token',
      { refreshToken }
    );
    return res.data;
  },

  async me(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
};
