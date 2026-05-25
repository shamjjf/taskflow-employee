import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  password: string;
  departmentId: number;
  designation?: string;
}

export interface UpdateTeamMemberInput {
  name?: string;
  email?: string;
  designation?: string;
  phone?: string;
}

export const teamMembersService = {
  async create(input: CreateTeamMemberInput) {
    const res = await api.post<ApiResponse<{ id: number }>>('/users', {
      ...input,
      role: 'employee',
    });
    return res.data;
  },

  async update(id: number, input: UpdateTeamMemberInput) {
    const res = await api.put<ApiResponse<{ id: number }>>(`/users/${id}`, input);
    return res.data;
  },

  async updateStatus(id: number, status: 'active' | 'inactive') {
    const res = await api.put<ApiResponse<{ id: number; status: string }>>(
      `/users/${id}/status`,
      { status }
    );
    return res.data;
  },

  async setPassword(id: number, newPassword: string) {
    await api.put<ApiResponse<null>>(`/users/${id}/password`, { newPassword });
  },
};
