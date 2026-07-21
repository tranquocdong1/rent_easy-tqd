import { Injectable } from '@nestjs/common';

export const INVOICE_DELETION_POLICY = 'INVOICE_DELETION_POLICY';

export interface InvoiceDeletionPolicy {
  canDelete(invoiceId: string): Promise<boolean>;
}

@Injectable()
export class DefaultInvoiceDeletionPolicy implements InvoiceDeletionPolicy {
  async canDelete(invoiceId: string): Promise<boolean> {
    // MVP: Default policy allows deletion.
    // In the future, the Payment Module can provide a custom implementation
    // to check if there are any associated payments.
    return true;
  }
}
