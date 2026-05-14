import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: adjuntar token JWT en cada solicitud
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parking_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: manejar errores globales (401 → redirigir al login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('parking_token');
      localStorage.removeItem('parking_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
