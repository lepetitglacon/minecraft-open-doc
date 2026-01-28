import axios from 'axios';

export const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add the auth header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // We can't use the store directly here easily without risk of early init,
      // but since this is runtime, it should be fine.
      // Alternatively, just clear storage.
      localStorage.removeItem('token');
      // optional: window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export function useApi() {
  return api;
}