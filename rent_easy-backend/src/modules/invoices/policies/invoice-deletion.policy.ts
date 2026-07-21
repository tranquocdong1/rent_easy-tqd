import { Injectable } from '@nestjs/common';

export const INVOICE_DELETION_POLICY = 'INVOICE_DELETION_POLICY';

export interface InvoiceDeletionPolicy {
  canDelete(invoiceId: string): Promise<boolean>;
}
