import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:8000');

const api = axios.create({
  baseURL: apiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearSession() {
  useAuthStore.getState().logout();
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${apiUrl}/api/v1/auth/login/refresh/`, {
            refresh: refreshToken,
          });
          if (res.status === 200) {
            localStorage.setItem('access_token', res.data.access);
            api.defaults.headers.common.Authorization = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        }
      } catch {
        // refresh failed — token is dead; leave state consistent
      }
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
