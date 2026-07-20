import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContractService } from '@/services/contract.service';
import { GetContractsParams, CreateContractPayload } from '@/types/contract';

export const useContracts = (params?: GetContractsParams) => {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: () => ContractService.getContracts(params),
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractPayload) => ContractService.createContract(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};
