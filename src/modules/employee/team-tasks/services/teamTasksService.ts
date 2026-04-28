import { api } from '@/lib/api';
import type { Task, TaskPriority, ApiResponse } from '@/types';

export const teamTasksService = {
  async list(): Promise<Task[]> {
    const res = await api.get<ApiResponse<Task[]>>('/tasks');
    return res.data;
  },

  async create(data: {
    title: string;
    description?: string;
    departmentId: number;
    priority: TaskPriority;
    deadline: string;
    assigneeIds: number[];
  }) {
    const res = await api.post<ApiResponse<Task>>('/tasks', data);
    return res.data;
  },
};
