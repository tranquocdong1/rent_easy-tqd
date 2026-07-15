import axiosInstance from '@/lib/axios';
import { PaginatedResponse, Property, PropertyQuery } from '@/types/property';

export const propertiesApi = {
  getAll: async (query?: PropertyQuery): Promise<PaginatedResponse<Property>> => {
    const response = await axiosInstance.get('/v1/properties', { params: query });
    return response.data;
  },
};
