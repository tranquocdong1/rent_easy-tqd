import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContractService } from '@/services/contract.service';
import { GetContractsParams, CreateContractPayload, UpdateContractPayload } from '@/types/contract';

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

export const useContract = (id: string) => {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: () => ContractService.getContractById(id),
    enabled: !!id,
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContractPayload }) => 
      ContractService.updateContract(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', variables.id] });
    },
  });
};
