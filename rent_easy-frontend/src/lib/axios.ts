import axios from 'axios';
import { useAuthStore } from './auth-store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // Important for sending/receiving HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token to headers
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401 and silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and not a retry, and not calling the refresh endpoint itself
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/v1/auth/refresh') &&
      !originalRequest.url?.includes('/v1/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await api.post('/v1/auth/refresh');
        const { accessToken } = refreshResponse.data.data;
        
        // Use getState to access user, but we don't have new user info from refresh API
        // Typically, we only update the token.
        const { user } = useAuthStore.getState();
        if (user) {
           useAuthStore.getState().setAuth(accessToken, user);
        }
        
        // Retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (token expired, reused, etc.)
        useAuthStore.getState().clearAuth();
        
        // Ideally we redirect to login here, but since this is not in a component,
        // window.location.href works for client-side redirection.
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
