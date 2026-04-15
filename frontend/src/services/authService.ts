import api, { setAuthToken } from './api';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    setAuthToken(response.data.token);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    setAuthToken(response.data.token);
    return response.data;
  },

  me: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthToken(null);
    }
  },
};
