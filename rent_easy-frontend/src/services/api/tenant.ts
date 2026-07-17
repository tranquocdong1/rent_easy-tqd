import axiosInstance from '@/lib/axios';
import { PaginatedResponse } from '@/types/property';
import { Tenant, TenantQuery } from '@/types/tenant';

export const tenantsApi = {
  getAll: async (query?: TenantQuery): Promise<PaginatedResponse<Tenant>> => {
    const params = query 
      ? Object.fromEntries(Object.entries(query).filter(([_, v]) => v !== '' && v != null)) 
      : undefined;
    const response = await axiosInstance.get(`/v1/tenants`, { params });
    return response.data;
  },
};
