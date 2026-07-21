import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { InvoiceSummaryProvider, InvoiceSummary } from '../../invoices/policies/invoice-summary.provider';
import { Invoice, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentInvoiceSummaryProvider implements InvoiceSummaryProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(invoice: Invoice): Promise<InvoiceSummary> {
    const paymentsRecords = await this.prisma.payment.findMany({
      where: {
        invoiceId: invoice.id,
        deletedAt: null,
      },
      select: {
        status: true,
        amount: true,
      },
    });

    let payments = paymentsRecords.length;
    let completedPayments = 0;
    let paidAmount = 0;

    for (const payment of paymentsRecords) {
      if (payment.status === PaymentStatus.COMPLETED) {
        completedPayments++;
        paidAmount += Number(payment.amount) || 0;
      }
    }

    const totalAmount = Number(invoice.totalAmount) || 0;

    return {
      payments,
      completedPayments,
      paidAmount,
      remainingAmount: Math.max(totalAmount - paidAmount, 0),
    };
  }
}
