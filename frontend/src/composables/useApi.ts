import axios from 'axios';

export const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function useApi() {
  return api;
}
