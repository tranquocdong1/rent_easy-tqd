export enum ContractStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED',
}

export interface ContractListItem {
  id: string;
  contractNumber: string;
  tenantName: string;
  roomCode: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: ContractStatus;
  createdAt: string;
}

export interface CreateContractPayload {
  tenantId: string;
  roomId: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
}

export interface GetContractsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContractStatus;
  propertyId?: string;
  roomId?: string;
  tenantId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContractsResponse {
  message: string;
  data: {
    items: ContractListItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
}
