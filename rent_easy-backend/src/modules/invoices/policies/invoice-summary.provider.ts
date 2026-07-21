import { Injectable } from '@nestjs/common';
import { Invoice } from '@prisma/client';

export const INVOICE_SUMMARY_PROVIDER = 'INVOICE_SUMMARY_PROVIDER';

export interface InvoiceSummary {
  payments: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface InvoiceSummaryProvider {
  getSummary(invoice: Invoice): Promise<InvoiceSummary>;
}

@Injectable()
export class DefaultInvoiceSummaryProvider implements InvoiceSummaryProvider {
  async getSummary(invoice: Invoice): Promise<InvoiceSummary> {
    const totalAmount = Number(invoice.totalAmount);
    const paidAmount = Number(invoice.paidAmount);
    return {
      payments: 0,
      paidAmount,
      remainingAmount: Math.max(totalAmount - paidAmount, 0),
    };
  }
}
