import { ContractStatus } from '@prisma/client';

export class ContractListItemDto {
  id: string;
  contractNumber: string;
  tenantName: string;
  roomCode: string;
  propertyName: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  status: ContractStatus;
  createdAt: Date;
}
