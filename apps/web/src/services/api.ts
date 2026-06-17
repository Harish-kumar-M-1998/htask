import axios from 'axios';
import type { AuthUser, TokenPair, UserProfileDetails } from '@htask/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post<TokenPair>(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: AuthUser } & TokenPair>('/auth/login', { email, password }),
  register: (data: { email: string; firstName: string; lastName: string }) =>
    api.post<{ message: string; email: string; emailSent: boolean; emailError?: string }>(
      '/auth/register',
      data,
    ),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get<{ data: UserProfileDetails }>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post<{ success: boolean }>('/auth/change-password', data),
};

export const tasksApi = {
  list: (params?: Record<string, unknown>) => api.get('/tasks', { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: Record<string, unknown>) => api.post('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/tasks/${id}`, data),
  remove: (id: string) => api.delete(`/tasks/${id}`),
  transition: (id: string, data: Record<string, unknown>) => api.post(`/tasks/${id}/transition`, data),
  getTransitions: (id: string) => api.get(`/tasks/${id}/transitions`),
  addComment: (id: string, content: string) => api.post(`/tasks/${id}/comments`, { content }),
  getHistory: (id: string) => api.get(`/tasks/${id}/history`),
  uploadAttachment: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  updateRoles: (id: string, data: { roleCodes: string[] }) => api.patch(`/users/${id}/roles`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export const projectsApi = {
  list: (params?: Record<string, unknown>) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: Record<string, unknown>) => api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/projects/${id}`, data),
  remove: (id: string) => api.delete(`/projects/${id}`),
  getHistory: (id: string) => api.get(`/projects/${id}/history`),
  createModule: (id: string, data: { name: string }) => api.post(`/projects/${id}/modules`, data),
};

export const analyticsApi = {
  dashboard: (scope?: string) => api.get('/analytics/dashboard', { params: { scope } }),
  taskDistribution: (projectId?: string) =>
    api.get('/analytics/task-distribution', { params: { projectId } }),
  memberPerformance: (memberId: string, from?: string, to?: string) =>
    api.get(`/analytics/members/${memberId}/performance`, { params: { from, to } }),
  utilization: (from?: string, to?: string) =>
    api.get('/analytics/utilization', { params: { from, to } }),
};

export const notificationsApi = {
  list: (page?: number) => api.get('/notifications', { params: { page } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getEmailConfig: () => api.get('/notifications/email-config'),
  getSmtpStatus: () => api.get('/notifications/email-config/smtp-status'),
  updateEmailConfig: (data: Record<string, unknown>) =>
    api.patch('/notifications/email-config', data),
  sendTestEmail: () => api.post('/notifications/email-config/test'),
  runDailyEmails: () => api.post('/notifications/email-config/run-daily'),
  runEmailChecks: () => api.post('/notifications/email-config/run-checks'),
};

export const searchApi = {
  search: (q: string, types?: string[]) => api.get('/search', { params: { q, types } }),
};

export const worklogApi = {
  start: (taskId: string) => api.post('/worklogs/start', { taskId }),
  pause: (id: string) => api.post(`/worklogs/${id}/pause`),
  resume: (id: string) => api.post(`/worklogs/${id}/resume`),
  stop: (id: string) => api.post(`/worklogs/${id}/stop`),
  summary: () => api.get('/worklogs/summary'),
};

export const auditApi = {
  list: (params?: Record<string, unknown>) => api.get('/audit', { params }),
};

export const reportsApi = {
  generate: (data: Record<string, unknown>) => api.post('/reports/generate', data),
  list: (params?: Record<string, unknown>) => api.get('/reports', { params }),
  download: (id: string) =>
    api.get(`/reports/${id}/download`, { responseType: 'blob' }),
};
