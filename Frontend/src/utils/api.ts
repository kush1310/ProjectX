import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getSession, logout } from './authStore';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const session = getSession();
    if (session && (session as any).token) {
      config.headers.set('Authorization', `Bearer ${(session as any).token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Auto logout on 401
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
