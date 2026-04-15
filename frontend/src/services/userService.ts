import api from './api';
import { AuthUser } from '../types';

interface UpdateMeData {
  name?: string;
  avatar?: string;
  color?: string;
  password?: string;
}

export const userService = {
  getAll: async (): Promise<AuthUser[]> => {
    const response = await api.get<AuthUser[]>('/users');
    return response.data;
  },

  updateMe: async (data: UpdateMeData): Promise<AuthUser> => {
    const response = await api.patch<AuthUser>('/users/me', data);
    return response.data;
  },
};
