import api from './api';
import { Notification } from '../types';

interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export const notificationService = {
  getAll: async (params?: GetNotificationsParams): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.put<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/mark-all-read');
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
