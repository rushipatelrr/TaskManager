import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';

    // Don't show toast for 401 on /auth/me (silent refresh)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/me')) {
      toast.error('Session expired. Please login again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
