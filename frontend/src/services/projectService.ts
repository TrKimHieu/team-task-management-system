import api from './api';
import { Project } from '../types';

interface CreateProjectData {
  name: string;
  description?: string;
  icon?: string;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  icon?: string;
}

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  getById: async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
