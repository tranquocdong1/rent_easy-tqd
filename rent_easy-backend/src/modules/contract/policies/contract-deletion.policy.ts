import { Injectable } from '@nestjs/common';

export const CONTRACT_DELETION_POLICY = 'CONTRACT_DELETION_POLICY';

export interface ContractDeletionPolicy {
  canDelete(contractId: string): Promise<boolean>;
}

@Injectable()
export class DefaultContractDeletionPolicy implements ContractDeletionPolicy {
  async canDelete(contractId: string): Promise<boolean> {
    // TODO: In the future, Invoice/Payment modules will implement checks here
    // e.g., return false if there are unpaid invoices.
    return true;
  }
}
