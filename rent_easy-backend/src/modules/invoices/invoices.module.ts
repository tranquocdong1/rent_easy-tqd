import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { INVOICE_DELETION_POLICY } from './policies/invoice-deletion.policy';
import { INVOICE_SUMMARY_PROVIDER } from './policies/invoice-summary.provider';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
