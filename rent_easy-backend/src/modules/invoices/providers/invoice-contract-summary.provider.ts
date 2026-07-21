import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ContractSummaryProvider, ContractSummary } from '../../contract/providers/contract-summary.provider';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoiceContractSummaryProvider implements ContractSummaryProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(contractId: string): Promise<ContractSummary> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        contractId,
        deletedAt: null,
      },
      select: {
        status: true,
        totalAmount: true,
        paidAmount: true,
      },
    });

    const totalInvoices = invoices.length;
    let unpaidInvoices = 0;
    let paidInvoices = 0;
    let totalAmount = 0;
    let totalPaid = 0;

    for (const inv of invoices) {
      if (inv.status !== InvoiceStatus.PAID) {
        unpaidInvoices++;
      } else {
        paidInvoices++;
      }
      totalAmount += Number(inv.totalAmount) || 0;
      totalPaid += Number(inv.paidAmount) || 0;
    }

    return {
      totalInvoices,
      unpaidInvoices,
      paidInvoices,
      totalAmount,
      totalPaid,
      remainingAmount: Math.max(totalAmount - totalPaid, 0),
    };
  }
}
