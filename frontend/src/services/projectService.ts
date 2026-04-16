import api from './api';
import { Project, UserRole } from '../types';

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

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  project_role: UserRole;
}

export interface ProjectStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  highPriorityTasks: number;
  completedTasks: number;
  completionRate: number;
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
    const response = await api.patch<Project>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return response.data;
  },

  addMember: async (projectId: string, userId: string, role?: UserRole): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, { userId, role });
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  getStats: async (projectId: string): Promise<ProjectStats> => {
    const response = await api.get<ProjectStats>(`/projects/${projectId}/stats`);
    return response.data;
  },
};

