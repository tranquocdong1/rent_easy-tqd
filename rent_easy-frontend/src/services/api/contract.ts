import axiosInstance from '@/lib/axios';
import { GetContractsParams, ContractsResponse, CreateContractPayload, ContractDetail, UpdateContractPayload } from '@/types/contract';

export const contractsApi = {
  getContracts: async (params?: GetContractsParams): Promise<ContractsResponse> => {
    const { data } = await axiosInstance.get('/v1/contracts', { params });
    return data;
  },

  getById: async (id: string): Promise<{ data: ContractDetail; message: string }> => {
    const { data } = await axiosInstance.get(`/v1/contracts/${id}`);
    return data;
  },

  create: async (payload: CreateContractPayload): Promise<{ data: ContractDetail; message: string }> => {
    const { data } = await axiosInstance.post('/v1/contracts', payload);
    return data;
  },

  update: async (id: string, payload: UpdateContractPayload): Promise<{ data: ContractDetail; message: string }> => {
    const { data } = await axiosInstance.patch(`/v1/contracts/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<{ message: string; data: null }> => {
    const { data } = await axiosInstance.delete(`/v1/contracts/${id}`);
    return data;
  },
};
