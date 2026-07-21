import { InvoiceStatus } from '@prisma/client';
import { InvoiceSummary } from '../policies/invoice-summary.provider';

export class InvoiceDetailResponseDto {
  id: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
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

  contract: {
    id: string;
    contractNumber: string;
  };
  tenant: {
    id: string;
    fullName: string;
    phone: string;
  };
  room: {
    id: string;
    code: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
  };
  summary: InvoiceSummary;

  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any, summary?: InvoiceSummary): InvoiceDetailResponseDto {
    const totalAmount = Number(entity.totalAmount);
    const paidAmount = Number(entity.paidAmount);
    
    // Ensure remainingAmount is non-negative
    let remainingAmount = totalAmount - paidAmount;
    if (remainingAmount < 0) remainingAmount = 0;

    return {
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      
      billingMonth: entity.billingMonth,
      billingYear: entity.billingYear,
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
      remainingAmount,
      status: entity.status,
      note: entity.note,

      contract: {
        id: entity.contract?.id || '',
        contractNumber: entity.contract?.contractNumber || '',
      },
      tenant: {
        id: entity.contract?.tenant?.id || '',
        fullName: entity.contract?.tenant?.fullName || '',
        phone: entity.contract?.tenant?.phone || '',
      },
      room: {
        id: entity.contract?.room?.id || '',
        code: entity.contract?.room?.code || '',
        name: entity.contract?.room?.name || '',
      },
      property: {
        id: entity.contract?.room?.property?.id || '',
        name: entity.contract?.room?.property?.name || '',
      },
      
      summary: summary || {
        payments: 0,
        completedPayments: 0,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
      },
      
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
