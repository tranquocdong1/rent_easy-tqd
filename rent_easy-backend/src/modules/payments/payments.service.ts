import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetPaymentsDto } from './dto/get-payments.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string, dto: GetPaymentsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentMethod,
      propertyId,
      roomId,
      contractId,
      invoiceId,
      tenantId,
      billingMonth,
      billingYear,
      paymentDateFrom,
      paymentDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = dto;

    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
      invoice: {
        deletedAt: null,
        contract: {
          deletedAt: null,
          room: {
            property: {
              ownerId, // Ownership check
            },
          },
        },
      },
    };

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { invoice: { contract: { tenant: { fullName: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (invoiceId) where.invoiceId = invoiceId;
    if (propertyId) where.invoice = { ...where.invoice as any, contract: { ...((where.invoice as any).contract || {}), room: { ...((where.invoice as any).contract?.room || {}), propertyId } } };
    if (roomId) where.invoice = { ...where.invoice as any, contract: { ...((where.invoice as any).contract || {}), roomId } };
    if (contractId) where.invoice = { ...where.invoice as any, contractId };
    if (tenantId) where.invoice = { ...where.invoice as any, contract: { ...((where.invoice as any).contract || {}), tenantId } };
    
    if (billingMonth) where.invoice = { ...where.invoice as any, billingMonth };
    if (billingYear) where.invoice = { ...where.invoice as any, billingYear };

    if (paymentDateFrom || paymentDateTo) {
      where.paymentDate = {};
      if (paymentDateFrom) where.paymentDate.gte = new Date(paymentDateFrom);
      if (paymentDateTo) where.paymentDate.lte = new Date(paymentDateTo);
    }

    const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
    if (sortBy === 'paymentDate') orderBy.paymentDate = sortOrder;
    else if (sortBy === 'amount') orderBy.amount = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          receiptNumber: true,
          paymentDate: true,
          amount: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              billingMonth: true,
              billingYear: true,
              contract: {
                select: {
                  tenant: {
                    select: {
                      id: true,
                      fullName: true,
                    },
                  },
                  room: {
                    select: {
                      id: true,
                      code: true,
                      property: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      message: 'Get payments successfully',
      data: {
        items: items.map(item => PaymentResponseDto.fromEntity(item)),
        meta: {
          totalItems,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
        },
      },
    };
  }
}
