import { Injectable } from '@nestjs/common';

export const CONTRACT_DELETION_POLICY = 'CONTRACT_DELETION_POLICY';

export interface ContractDeletionPolicy {
  canDelete(contractId: string): Promise<boolean>;
}
