export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD';
export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Payment {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  tenantName: string;
  roomCode: string;
  propertyName: string;
}

export type PaymentListItem = Payment;

export interface PaymentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  propertyId?: string;
  roomId?: string;
  contractId?: string;
  invoiceId?: string;
  tenantId?: string;
  billingMonth?: number;
  billingYear?: number;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  sortBy?: 'paymentDate' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentsResponse {
  message: string;
  data: {
    items: Payment[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
}
