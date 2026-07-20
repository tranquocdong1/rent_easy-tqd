import { useQuery } from '@tanstack/react-query';
import { ContractService } from '@/services/contract.service';
import { GetContractsParams } from '@/types/contract';

export const useContracts = (params?: GetContractsParams) => {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: () => ContractService.getContracts(params),
  });
};
