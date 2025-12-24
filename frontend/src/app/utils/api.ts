// app/utils/api.ts

export const API_BASE_URL = 'http://127.0.0.1:8000';

export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});