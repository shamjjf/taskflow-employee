import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  password: string;
  departmentId: number;
  designation?: string;
}

export const teamMembersService = {
  async create(input: CreateTeamMemberInput) {
    const res = await api.post<ApiResponse<{ id: number }>>('/users', {
      ...input,
      role: 'employee',
    });
    return res.data;
  },
};
