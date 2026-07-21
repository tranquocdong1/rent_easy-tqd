import { Module, Global } from '@nestjs/common';
import { RoomUsageChecker } from '../../modules/rooms/policies/room-usage-checker';
import { CONTRACT_DELETION_POLICY } from '../../modules/contract/policies/contract-deletion.policy';
import { CONTRACT_SUMMARY_PROVIDER } from '../../modules/contract/providers/contract-summary.provider';
import { INVOICE_DELETION_POLICY } from '../../modules/invoices/policies/invoice-deletion.policy';
import { INVOICE_SUMMARY_PROVIDER } from '../../modules/invoices/policies/invoice-summary.provider';

import { ContractRoomUsageChecker } from '../../modules/contract/policies/contract-room-usage-checker';
import { InvoiceContractDeletionPolicy } from '../../modules/invoices/policies/invoice-contract-deletion.policy';
import { InvoiceContractSummaryProvider } from '../../modules/invoices/providers/invoice-contract-summary.provider';
import { PaymentInvoiceDeletionPolicy } from '../../modules/payments/policies/payment-invoice-deletion.policy';
import { PaymentInvoiceSummaryProvider } from '../../modules/payments/policies/payment-invoice-summary.provider';

@Global()
@Module({
  providers: [
    {
      provide: RoomUsageChecker,
      useClass: ContractRoomUsageChecker,
    },
    {
      provide: CONTRACT_DELETION_POLICY,
      useClass: InvoiceContractDeletionPolicy,
    },
    {
      provide: CONTRACT_SUMMARY_PROVIDER,
      useClass: InvoiceContractSummaryProvider,
    },
    {
      provide: INVOICE_DELETION_POLICY,
      useClass: PaymentInvoiceDeletionPolicy,
    },
    {
      provide: INVOICE_SUMMARY_PROVIDER,
      useClass: PaymentInvoiceSummaryProvider,
    },
  ],
  exports: [
    RoomUsageChecker,
    CONTRACT_DELETION_POLICY,
    CONTRACT_SUMMARY_PROVIDER,
    INVOICE_DELETION_POLICY,
    INVOICE_SUMMARY_PROVIDER,
  ],
})
export class GlobalPoliciesModule {}
