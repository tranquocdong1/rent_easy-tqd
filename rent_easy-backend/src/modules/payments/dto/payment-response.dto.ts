import { PaymentStatus, PaymentMethod, InvoiceStatus } from '@prisma/client';

export class PaymentResponseDto {
  id: string;
  receiptNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  tenantName: string;
  roomCode: string;
  propertyName: string;

  static fromEntity(entity: any): PaymentResponseDto {
    return {
      id: entity.id,
      receiptNumber: entity.receiptNumber,
      paymentDate: entity.paymentDate,
      amount: Number(entity.amount),
      paymentMethod: entity.paymentMethod,
      status: entity.status,
      createdAt: entity.createdAt,
      
      invoiceNumber: entity.invoice?.invoiceNumber || '',
      invoiceStatus: entity.invoice?.status,
      tenantName: entity.invoice?.contract?.tenant?.fullName || '',
      roomCode: entity.invoice?.contract?.room?.code || '',
      propertyName: entity.invoice?.contract?.room?.property?.name || '',
    };
  }
}
