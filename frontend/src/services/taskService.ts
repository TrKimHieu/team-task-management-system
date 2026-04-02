import api from './api';
import { Task, Status } from '../types';

interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  status?: Status;
  priority?: 'low' | 'medium' | 'high';
  assigneeId?: string;
  deadline?: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: Status;
  priority?: 'low' | 'medium' | 'high';
  assigneeId?: string;
  deadline?: string;
}

export const taskService = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    const params = projectId ? { projectId } : {};
    const response = await api.get<Task[]>('/api/tasks', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/api/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskData): Promise<Task> => {
    const response = await api.post<Task>('/api/tasks', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await api.put<Task>(`/api/tasks/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: Status): Promise<Task> => {
    const response = await api.patch<Task>(`/api/tasks/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },
};
