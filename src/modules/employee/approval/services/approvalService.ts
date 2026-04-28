import { api } from '@/lib/api';
import type { Report, ApiResponse } from '@/types';

export const approvalService = {
  async listPending(): Promise<Report[]> {
    const res = await api.get<ApiResponse<Report[]>>('/reports/pending-approval');
    return res.data;
  },

  async approve(id: number): Promise<Report> {
    const res = await api.put<ApiResponse<Report>>(`/reports/${id}/approve`);
    return res.data;
  },

  async reject(id: number, comment: string): Promise<Report> {
    const res = await api.put<ApiResponse<Report>>(`/reports/${id}/reject`, { comment });
    return res.data;
  },
};
