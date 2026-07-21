import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { INVOICE_DELETION_POLICY, DefaultInvoiceDeletionPolicy } from './policies/invoice-deletion.policy';
import { INVOICE_SUMMARY_PROVIDER, DefaultInvoiceSummaryProvider } from './policies/invoice-summary.provider';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    {
      provide: INVOICE_DELETION_POLICY,
      useClass: DefaultInvoiceDeletionPolicy,
    },
    {
      provide: INVOICE_SUMMARY_PROVIDER,
      useClass: DefaultInvoiceSummaryProvider,
    },
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
