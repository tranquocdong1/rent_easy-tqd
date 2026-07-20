import axiosInstance from '@/lib/axios';
import { ContractsResponse, GetContractsParams, CreateContractPayload } from '@/types/contract';

export const ContractService = {
  getContracts: async (params?: GetContractsParams): Promise<ContractsResponse> => {
    const response = await axiosInstance.get<ContractsResponse>('/v1/contracts', { params });
    return response.data;
  },
  createContract: async (payload: CreateContractPayload) => {
    const response = await axiosInstance.post('/v1/contracts', payload);
    return response.data;
  },
};
