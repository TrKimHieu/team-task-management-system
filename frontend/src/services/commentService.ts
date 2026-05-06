import api from './api';
import { Comment } from '../types';

export const commentService = {
  getByTaskId: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/comments/task/${taskId}`);
    return response.data;
  },

  create: async (taskId: string, content: string): Promise<Comment> => {
    const response = await api.post<Comment>(`/comments/task/${taskId}`, { content });
    return response.data;
  },

  update: async (id: string, content: string): Promise<Comment> => {
    const response = await api.put<Comment>(`/comments/${id}`, { content });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};
