import { api } from '@/lib/api';
import type { Task, TaskComment, TaskPriority, UserRole, ApiResponse } from '@/types';

export interface ReportToOption {
  id: number;
  name: string;
  role: UserRole;
  designation?: string | null;
}

export interface CreateSelfTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline: string;
  reportToId?: number;
}

export const employeeTasksService = {
  async getMyTasks(): Promise<Task[]> {
    const res = await api.get<ApiResponse<Task[]>>('/tasks');
    return res.data;
  },

  // Who the current user reports to when self-assigning a task: their team
  // leader (employees) or the org's sub-admins (team leaders).
  async getReportToOptions(): Promise<ReportToOption[]> {
    const res = await api.get<ApiResponse<ReportToOption[]>>('/tasks/report-to-options');
    return res.data;
  },

  async createSelfTask(data: CreateSelfTaskInput): Promise<Task> {
    const res = await api.post<ApiResponse<Task>>('/tasks/self', data);
    return res.data;
  },

  async getTask(id: number): Promise<Task> {
    const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return res.data;
  },

  async startTask(id: number): Promise<Task> {
    const res = await api.put<ApiResponse<Task>>(`/tasks/${id}/start`);
    return res.data;
  },

  async completeTask(id: number): Promise<Task> {
    const res = await api.put<ApiResponse<Task>>(`/tasks/${id}/complete`);
    return res.data;
  },

  async reviewTask(id: number): Promise<Task> {
    const res = await api.put<ApiResponse<Task>>(`/tasks/${id}/review`);
    return res.data;
  },

  async rejectTask(id: number, reason: string): Promise<Task> {
    const res = await api.put<ApiResponse<Task>>(`/tasks/${id}/reject`, { reason });
    return res.data;
  },

  async getComments(taskId: number): Promise<TaskComment[]> {
    const res = await api.get<ApiResponse<TaskComment[]>>(`/tasks/${taskId}/comments`);
    return res.data;
  },

  async addComment(taskId: number, message: string, attachmentUrl?: string) {
    const res = await api.post<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, {
      message,
      attachmentUrl,
    });
    return res.data;
  },
};
