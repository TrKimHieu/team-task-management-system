import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_STORAGE_KEY = 'teamtask_auth_token';

let unauthorizedHandler: (() => void) | null = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getAuthToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const onUnauthorized = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
