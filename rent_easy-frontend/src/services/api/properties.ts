import axiosInstance from '@/lib/axios';
import { PaginatedResponse, Property, PropertyQuery, CreatePropertyPayload } from '@/types/property';

export const propertiesApi = {
  getAll: async (query?: PropertyQuery): Promise<PaginatedResponse<Property>> => {
    const response = await axiosInstance.get('/v1/properties', { params: query });
    return response.data;
  },
  create: async (payload: CreatePropertyPayload): Promise<{ message: string; data: Property }> => {
    const response = await axiosInstance.post('/v1/properties', payload);
    return response.data;
  },
};
