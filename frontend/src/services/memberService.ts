import api from './api';
import { Member } from '../types';

interface CreateMemberData {
  name: string;
  avatar?: string;
  color?: string;
}

interface UpdateMemberData {
  name?: string;
  avatar?: string;
  color?: string;
}

export const memberService = {
  getAll: async (): Promise<Member[]> => {
    const response = await api.get<Member[]>('/api/members');
    return response.data;
  },

  getById: async (id: string): Promise<Member> => {
    const response = await api.get<Member>(`/api/members/${id}`);
    return response.data;
  },

  create: async (data: CreateMemberData): Promise<Member> => {
    const response = await api.post<Member>('/api/members', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMemberData): Promise<Member> => {
    const response = await api.put<Member>(`/api/members/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/members/${id}`);
  },
};
