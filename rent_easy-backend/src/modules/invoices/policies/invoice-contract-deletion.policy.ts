import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ContractDeletionPolicy } from '../../contract/policies/contract-deletion.policy';

@Injectable()
export class InvoiceContractDeletionPolicy implements ContractDeletionPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async canDelete(contractId: string): Promise<boolean> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        contractId,
        deletedAt: null,
      },
      select: { id: true },
    });
    
    return !invoice;
  }
}
