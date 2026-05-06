import { api } from '@/lib/api';
import type { Task, TaskComment, ApiResponse } from '@/types';

export const employeeTasksService = {
  async getMyTasks(): Promise<Task[]> {
    const res = await api.get<ApiResponse<Task[]>>('/tasks');
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
