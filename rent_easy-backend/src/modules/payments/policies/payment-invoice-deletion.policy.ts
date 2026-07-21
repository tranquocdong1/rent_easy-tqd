import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { InvoiceDeletionPolicy } from '../../invoices/policies/invoice-deletion.policy';

@Injectable()
export class PaymentInvoiceDeletionPolicy implements InvoiceDeletionPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async canDelete(invoiceId: string): Promise<boolean> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        invoiceId,
        deletedAt: null,
      },
      select: { id: true },
    });
    
    return !payment;
  }
}
