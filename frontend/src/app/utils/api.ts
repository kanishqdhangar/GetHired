// app/utils/api.ts

export const API_BASE_URL = 'https://gethired-backend-b7my.onrender.com';

export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});