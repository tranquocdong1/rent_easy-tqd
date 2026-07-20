import axiosInstance from '@/lib/axios';
import { ContractsResponse, GetContractsParams, CreateContractPayload, ContractDetail, UpdateContractPayload } from '@/types/contract';

export const ContractService = {
  getContracts: async (params?: GetContractsParams): Promise<ContractsResponse> => {
    const response = await axiosInstance.get<ContractsResponse>('/v1/contracts', { params });
    return response.data;
  },
  createContract: async (payload: CreateContractPayload) => {
    const response = await axiosInstance.post('/v1/contracts', payload);
    return response.data;
  },
  getContractById: async (id: string): Promise<{ message: string; data: ContractDetail }> => {
    const response = await axiosInstance.get(`/v1/contracts/${id}`);
    return response.data;
  },
  updateContract: async (id: string, payload: UpdateContractPayload): Promise<{ message: string; data: ContractDetail }> => {
    const response = await axiosInstance.patch(`/v1/contracts/${id}`, payload);
    return response.data;
  },
  remove: async (id: string): Promise<{ message: string; data: null }> => {
    const response = await axiosInstance.delete(`/v1/contracts/${id}`);
    return response.data;
  },
};
