import api from './api';
import { Priority, Task, Status } from '../types';

interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  assigneeIds?: string[];
  dueDate?: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  assigneeIds?: string[];
  dueDate?: string;
  position?: number;
  completed?: boolean;
}

export const taskService = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    const params = projectId ? { projectId } : {};
    const response = await api.get<Task[]>('/tasks', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskData): Promise<Task> => {
    const response = await api.post<Task>('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: Status): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/status`, { status });
    return response.data;
  },

  reorder: async (id: string, status: Status, position: number): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/reorder`, { status, position });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {

    await api.delete(`/tasks/${id}`);
  },
};
