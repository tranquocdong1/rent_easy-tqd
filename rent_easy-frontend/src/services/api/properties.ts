import axiosInstance from '@/lib/axios';
import { PaginatedResponse, Property, PropertyQuery, CreatePropertyPayload, UpdatePropertyPayload } from '@/types/property';

export const propertiesApi = {
  getAll: async (query?: PropertyQuery): Promise<PaginatedResponse<Property>> => {
    const response = await axiosInstance.get('/v1/properties', { params: query });
    return response.data;
  },
  create: async (payload: CreatePropertyPayload): Promise<{ message: string; data: Property }> => {
    const response = await axiosInstance.post('/v1/properties', payload);
    return response.data;
  },
  getById: async (id: string): Promise<{ message: string; data: Property }> => {
    const response = await axiosInstance.get(`/v1/properties/${id}`);
    return response.data;
  },
  update: async (id: string, payload: UpdatePropertyPayload): Promise<{ message: string; data: Property }> => {
    const response = await axiosInstance.patch(`/v1/properties/${id}`, payload);
    return response.data;
  },
};
