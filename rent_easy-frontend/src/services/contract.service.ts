import axiosInstance from '@/lib/axios';
import { ContractsResponse, GetContractsParams } from '@/types/contract';

export const ContractService = {
  getContracts: async (params?: GetContractsParams): Promise<ContractsResponse> => {
    const response = await axiosInstance.get<ContractsResponse>('/v1/contracts', { params });
    return response.data;
  },
};
