import axios from 'axios';

export const apiClient = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL ?? ''),
  headers: {
    'Content-Type': 'application/json',
  },
});
