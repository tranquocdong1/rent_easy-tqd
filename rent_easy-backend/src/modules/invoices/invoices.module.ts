import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { INVOICE_DELETION_POLICY, DefaultInvoiceDeletionPolicy } from './policies/invoice-deletion.policy';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    {
      provide: INVOICE_DELETION_POLICY,
      useClass: DefaultInvoiceDeletionPolicy,
    },
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
