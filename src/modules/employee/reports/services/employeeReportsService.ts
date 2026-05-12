import { api } from '@/lib/api';
import type { Report, ReportType, ApiResponse } from '@/types';

export interface SubmitReportDto {
  reportType: ReportType;
  weeklyObjective?: string;
  description: string;
  taskId?: number;
  reportDate?: string;
}

export interface ResubmitReportDto {
  reportType?: ReportType;
  weeklyObjective?: string | null;
  description: string;
  taskId?: number | null;
}

export const employeeReportsService = {
  async getMyReports(): Promise<Report[]> {
    const res = await api.get<ApiResponse<Report[]>>('/reports?scope=mine');
    return res.data;
  },

  async getDepartmentReports(): Promise<Report[]> {
    const res = await api.get<ApiResponse<Report[]>>('/reports');
    return res.data;
  },

  async getReport(id: number): Promise<Report> {
    const res = await api.get<ApiResponse<Report>>(`/reports/${id}`);
    return res.data;
  },

  async submitReport(data: SubmitReportDto): Promise<Report> {
    const res = await api.post<ApiResponse<Report>>('/reports', data);
    return res.data;
  },

  async resubmitReport(id: number, data: ResubmitReportDto): Promise<Report> {
    const res = await api.put<ApiResponse<Report>>(`/reports/${id}/resubmit`, data);
    return res.data;
  },
};
