import api from './api';

export const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  toggleTask: (id) => api.patch(`/tasks/${id}/toggle`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getStats: () => api.get('/tasks/stats'),
};

export const userService = {
  getList: () => api.get('/users/list'),
  getAll: (params) => api.get('/users', { params }),
  getLeaderboard: () => api.get('/users/leaderboard'),
  getActivity: (id = 'me') => api.get(`/users/activity/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

