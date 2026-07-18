import axiosInstance from '@/lib/axios';
import { PaginatedResponse } from '@/types/property';
import { Tenant, TenantQuery, Gender } from '@/types/tenant';

export interface CreateTenantPayload {
  fullName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  identityNumber: string;
  identityIssuedDate?: string | null;
  identityIssuedPlace?: string | null;
  phone?: string | null;
  email?: string | null;
  permanentAddress?: string | null;
  note?: string | null;
}

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

export const tenantsApi = {
  getAll: async (query?: TenantQuery): Promise<PaginatedResponse<Tenant>> => {
    const params = query 
      ? Object.fromEntries(Object.entries(query).filter(([_, v]) => v !== '' && v != null)) 
      : undefined;
    const response = await axiosInstance.get(`/v1/tenants`, { params });
    return response.data;
  },
  getById: async (id: string): Promise<{ message: string; data: Tenant }> => {
    const response = await axiosInstance.get(`/v1/tenants/${id}`);
    return response.data;
  },
  create: async (payload: CreateTenantPayload): Promise<{ message: string; data: Tenant }> => {
    const response = await axiosInstance.post(`/v1/tenants`, payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateTenantPayload): Promise<{ message: string; data: Tenant }> => {
    const response = await axiosInstance.patch(`/v1/tenants/${id}`, payload);
    return response.data;
  }
};
