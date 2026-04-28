import { api } from '@/lib/api';
import type { Report, ReportType, ApiResponse } from '@/types';

export interface SubmitReportDto {
  reportType: ReportType;
  description: string;
  taskId?: number;
  reportDate?: string;
}

export const employeeReportsService = {
  async getMyReports(): Promise<Report[]> {
    const res = await api.get<ApiResponse<Report[]>>('/reports');
    return res.data;
  },

  async submitReport(data: SubmitReportDto): Promise<Report> {
    const res = await api.post<ApiResponse<Report>>('/reports', data);
    return res.data;
  },
};
