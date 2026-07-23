import axiosInstance from '@/lib/axios';
import { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/v1/auth/login', payload);
    return response.data;
  },
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/v1/auth/register', payload);
    return response.data;
  },
  logout: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/v1/auth/logout');
    return response.data;
  },
};
