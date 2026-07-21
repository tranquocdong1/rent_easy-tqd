import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetPaymentsDto } from './dto/get-payments.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { Prisma, AuditAction, InvoiceStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) { }

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

  async create(ownerId: string, dto: CreatePaymentDto) {
      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          return await this.prisma.$transaction(async (tx) => {
            // 1. Load Invoice with ownership and soft delete check
            const invoice = await tx.invoice.findFirst({
              where: {
                id: dto.invoiceId,
                deletedAt: null,
                contract: {
                  deletedAt: null,
                  room: { property: { ownerId } },
                },
              },
              include: {
                contract: {
                  include: {
                    tenant: true,
                    room: { include: { property: true } },
                  },
                },
              },
            });

            if (!invoice) {
              throw new NotFoundException({
                message: 'Không tìm thấy hóa đơn hoặc không có quyền truy cập',
                code: 'INVOICE_NOT_FOUND',
              });
            }

            // 2. Check Invoice Status
            if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED || (invoice.status as string) === 'VOID') {
              throw new ConflictException({
                message: 'Hóa đơn đã thanh toán hoặc đã hủy, không thể thanh toán thêm',
                code: 'INVOICE_CANNOT_PAY',
              });
            }

            // 3. Validate Amount vs Remaining
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = Number(invoice.paidAmount);
            const remaining = totalAmount - paidAmount;

            if (dto.amount > remaining) {
              throw new ConflictException({
                message: 'Số tiền thanh toán vượt quá số tiền còn lại của hóa đơn',
                code: 'PAYMENT_EXCEEDS_REMAINING_AMOUNT',
              });
            }

            // 4. Generate Receipt Number
            const dateStr = new Date(dto.paymentDate).toISOString().slice(0, 7).replace('-', '');
            const lastPayment = await tx.payment.findFirst({
              where: { receiptNumber: { startsWith: `RCPT-${dateStr}-` } },
              orderBy: { receiptNumber: 'desc' },
            });

            let nextNum = 1;
            if (lastPayment) {
              const lastNum = parseInt(lastPayment.receiptNumber.split('-')[2], 10);
              nextNum = lastNum + 1;
            }
            const receiptNumber = `RCPT-${dateStr}-${nextNum.toString().padStart(4, '0')}`;

            // 5. Create Payment
            const payment = await tx.payment.create({
              data: {
                invoiceId: dto.invoiceId,
                receiptNumber,
                paymentDate: new Date(dto.paymentDate),
                amount: dto.amount,
                paymentMethod: dto.paymentMethod,
                referenceNumber: dto.referenceNumber,
                note: dto.note,
                status: PaymentStatus.COMPLETED,
              },
              include: {
                invoice: {
                  include: {
                    contract: {
                      include: {
                        tenant: true,
                        room: { include: { property: true } },
                      },
                    },
                  },
                },
              },
            });

            // 6. Update Invoice
            const newPaidAmount = paidAmount + dto.amount;
            let newStatus: InvoiceStatus = invoice.status;
            if (newPaidAmount >= totalAmount) {
              newStatus = InvoiceStatus.PAID;
            } else if (newPaidAmount > 0) {
              newStatus = InvoiceStatus.PARTIALLY_PAID;
            }

            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                paidAmount: newPaidAmount,
                status: newStatus,
              },
            });

            // 7. Audit Log
            await tx.auditLog.create({
              data: {
                userId: ownerId,
                action: AuditAction.PAYMENT_CREATED,
                entity: 'Payment',
                entityId: payment.id,
                metadata: {
                  paymentId: payment.id,
                  receiptNumber: payment.receiptNumber,
                  invoiceId: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  contractId: invoice.contractId,
                  tenantId: invoice.contract.tenantId,
                  roomId: invoice.contract.roomId,
                  propertyId: invoice.contract.room.propertyId,
                  amount: dto.amount,
                  paymentMethod: dto.paymentMethod,
                },
              },
            });

            return {
              message: 'Payment created successfully',
              data: PaymentResponseDto.fromEntity(payment),
            };
          }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          });
        } catch (error: any) {
          // Handle serialization failure (P2034) or unique constraint violation (P2002)
          if (error.code === 'P2034' || error.code === 'P2002') {
            attempt++;
            if (attempt >= maxRetries) {
              throw new ConflictException({
                message: 'Hệ thống đang bận, vui lòng thử lại sau',
                code: 'PAYMENT_CONCURRENCY_ERROR',
              });
            }
            // Continue to next iteration to retry
            continue;
          }
          // Rethrow other errors (e.g. NotFound, BadRequest from inside tx)
          throw error;
        }
      }
    }
  }
