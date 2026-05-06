import api from './api';
import { Label } from '../types';

export const labelService = {
  getByProjectId: async (projectId: string): Promise<Label[]> => {
    const response = await api.get<Label[]>(`/labels/project/${projectId}`);
    return response.data;
  },

  create: async (projectId: string, data: { name: string; color?: string }): Promise<Label> => {
    const response = await api.post<Label>(`/labels/project/${projectId}`, data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; color?: string }): Promise<Label> => {
    const response = await api.put<Label>(`/labels/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/labels/${id}`);
  },

  getTaskLabels: async (taskId: string): Promise<Label[]> => {
    const response = await api.get<Label[]>(`/labels/task/${taskId}`);
    return response.data;
  },

  assignToTask: async (taskId: string, labelId: string): Promise<void> => {
    await api.post(`/labels/task/${taskId}/assign/${labelId}`);
  },

  removeFromTask: async (taskId: string, labelId: string): Promise<void> => {
    await api.delete(`/labels/task/${taskId}/remove/${labelId}`);
  },
};
