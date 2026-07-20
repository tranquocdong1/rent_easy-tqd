import { Injectable } from '@nestjs/common';

export const CONTRACT_SUMMARY_PROVIDER = 'CONTRACT_SUMMARY_PROVIDER';

export interface ContractSummary {
  unpaidInvoices: number;
  totalPaid: number;
  totalInvoices: number;
}

export interface ContractSummaryProvider {
  getSummary(contractId: string): Promise<ContractSummary>;
}

@Injectable()
export class DefaultContractSummaryProvider implements ContractSummaryProvider {
  async getSummary(contractId: string): Promise<ContractSummary> {
    // MVP: Return mock data. 
    // Do NOT query the database here. Future Invoice/Payment modules will provide real implementation.
    return {
      unpaidInvoices: 0,
      totalPaid: 0,
      totalInvoices: 0,
    };
  }
}
