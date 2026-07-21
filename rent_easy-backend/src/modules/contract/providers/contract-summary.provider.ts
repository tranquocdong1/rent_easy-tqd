import { Injectable } from '@nestjs/common';

export const CONTRACT_SUMMARY_PROVIDER = 'CONTRACT_SUMMARY_PROVIDER';

export interface ContractSummary {
  totalInvoices: number;
  unpaidInvoices: number;
  paidInvoices: number;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
}

export interface ContractSummaryProvider {
  getSummary(contractId: string): Promise<ContractSummary>;
}

