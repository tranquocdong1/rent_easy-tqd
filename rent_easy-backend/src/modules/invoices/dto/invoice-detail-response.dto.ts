import { InvoiceStatus } from '@prisma/client';

export class InvoiceDetailResponseDto {
  id: string;
  invoiceNumber: string;
  contractId: string;
  tenantName: string;
  roomCode: string;
  propertyName: string;
  billingMonth: number;
  billingYear: number;
  billingPeriod: string;
  issueDate: Date;
  dueDate: Date;
  
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
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): InvoiceDetailResponseDto {
    const totalAmount = Number(entity.totalAmount);
    const paidAmount = Number(entity.paidAmount);
    
    return {
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      contractId: entity.contractId,
      tenantName: entity.contract?.tenant?.fullName || '',
      roomCode: entity.contract?.room?.code || '',
      propertyName: entity.contract?.room?.property?.name || '',
      billingMonth: entity.billingMonth,
      billingYear: entity.billingYear,
      billingPeriod: `${entity.billingMonth.toString().padStart(2, '0')}/${entity.billingYear}`,
      issueDate: entity.issueDate,
      dueDate: entity.dueDate,
      
      roomRent: Number(entity.roomRent),
      electricityAmount: Number(entity.electricityAmount),
      waterAmount: Number(entity.waterAmount),
      serviceAmount: Number(entity.serviceAmount),
      otherAmount: Number(entity.otherAmount),
      discountAmount: Number(entity.discountAmount),
      
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      status: entity.status,
      note: entity.note,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
