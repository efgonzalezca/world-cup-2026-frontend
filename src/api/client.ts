import axios from 'axios';

// Dynamically use the same host the browser is on (works for localhost AND LAN IP)
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on login/auth requests — let the form handle its own errors
      const url = error.config?.url || '';
      const isAuthRequest = url.includes('/auth/login') || url.includes('/users/reset-password');
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default client;
