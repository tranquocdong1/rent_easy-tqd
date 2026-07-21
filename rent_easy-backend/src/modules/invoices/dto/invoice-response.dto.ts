import { InvoiceStatus } from '@prisma/client';

export class InvoiceResponseDto {
  id: string;
  invoiceNumber: string;
  propertyName: string;
  roomCode: string;
  tenantName: string;
  billingPeriod: string;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  createdAt: Date;

  static fromEntity(entity: any): InvoiceResponseDto {
    const totalAmount = Number(entity.totalAmount);
    const paidAmount = Number(entity.paidAmount);
    
    return {
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      propertyName: entity.contract?.room?.property?.name || '',
      roomCode: entity.contract?.room?.code || '',
      tenantName: entity.contract?.tenant?.fullName || '',
      billingPeriod: `${entity.billingMonth.toString().padStart(2, '0')}/${entity.billingYear}`,
      dueDate: entity.dueDate,
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}
