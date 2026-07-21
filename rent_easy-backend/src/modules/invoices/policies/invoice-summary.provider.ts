import { Injectable } from '@nestjs/common';
import { Invoice } from '@prisma/client';

export const INVOICE_SUMMARY_PROVIDER = 'INVOICE_SUMMARY_PROVIDER';

export interface InvoiceSummary {
  payments: number;
  completedPayments: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface InvoiceSummaryProvider {
  getSummary(invoice: Invoice): Promise<InvoiceSummary>;
}

