import axios from 'axios';
import { toast } from 'sonner';

const TOKEN_KEY = 'gs_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { Accept: 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearToken();
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    } else if (status >= 500) {
      toast.error('Error del servidor. Intenta de nuevo.');
    }
    return Promise.reject(error);
  },
);

export type ApiError = { message?: string; errors?: Record<string, string[]> };

export const apiErrorMessage = (err: unknown): string => {
  const e = err as { response?: { data?: ApiError } };
  if (e?.response?.data?.errors) {
    return Object.values(e.response.data.errors).flat().join(' · ');
  }
  return e?.response?.data?.message ?? 'Ocurrió un error inesperado';
};
