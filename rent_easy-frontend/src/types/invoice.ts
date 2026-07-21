export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  propertyName: string;
  roomCode: string;
  tenantName: string;
  billingPeriod: string; // e.g., '10/2023'
  dueDate: Date | string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  createdAt: Date | string;
}

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  contractId: string;
  tenantName: string;
  roomCode: string;
  propertyName: string;
  billingMonth: number;
  billingYear: number;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  
  roomRent: number;
  electricityAmount: number;
  waterAmount: number;
  serviceAmount: number;
  otherAmount: number;
  discountAmount: number;
  
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  propertyId?: string;
  roomId?: string;
  contractId?: string;
  month?: number;
  year?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoicesResponse {
  message: string;
  data: {
    items: Invoice[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
}

export interface InvoiceResponse {
  message: string;
  data: Invoice;
}

export interface InvoiceDetailResponse {
  message: string;
  data: InvoiceDetail;
}

export interface CreateInvoiceRequest {
  contractId: string;
  billingMonth: number;
  billingYear: number;
  issueDate: string;
  dueDate: string;
  electricityAmount: number;
  waterAmount: number;
  serviceAmount: number;
  otherAmount: number;
  discountAmount: number;
  note?: string;
}

export interface UpdateInvoiceRequest {
  issueDate?: string;
  dueDate?: string;
  electricityAmount?: number;
  waterAmount?: number;
  serviceAmount?: number;
  otherAmount?: number;
  discountAmount?: number;
  note?: string;
}
