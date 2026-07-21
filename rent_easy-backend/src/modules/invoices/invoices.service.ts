import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoiceDetailResponseDto } from './dto/invoice-detail-response.dto';
import { Prisma, AuditAction, InvoiceStatus, ContractStatus, Invoice } from '@prisma/client';
import { INVOICE_DELETION_POLICY, type InvoiceDeletionPolicy } from './policies/invoice-deletion.policy';
import { INVOICE_SUMMARY_PROVIDER, type InvoiceSummaryProvider } from './policies/invoice-summary.provider';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(INVOICE_DELETION_POLICY)
    private readonly invoiceDeletionPolicy: InvoiceDeletionPolicy,
    @Inject(INVOICE_SUMMARY_PROVIDER)
    private readonly invoiceSummaryProvider: InvoiceSummaryProvider,
  ) {}

  async findAll(ownerId: string, query: InvoiceQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      statuses,
      propertyId,
      roomId,
      contractId,
      month,
      year,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Validate sortBy whitelist
    const allowedSortFields = ['createdAt', 'dueDate', 'totalAmount', 'invoiceNumber'];
    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Trường sắp xếp không hợp lệ.',
        code: 'BAD_REQUEST',
      });
    }

    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      contract: {
        room: {
          property: {
            ownerId, // Ensure it belongs to the current owner
          },
        },
      },
    };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search.trim(), mode: 'insensitive' } },
        { contract: { tenant: { fullName: { contains: search.trim(), mode: 'insensitive' } } } },
        { contract: { room: { code: { contains: search.trim(), mode: 'insensitive' } } } },
      ];
    }

    if (status) {
      where.status = status;
    }
    
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }
    
    if (contractId) {
      where.contractId = contractId;
    }

    if (roomId || propertyId) {
      const contractFilter = where.contract as Prisma.ContractWhereInput;
      const roomFilter = contractFilter.room as Prisma.RoomWhereInput;

      where.contract = {
        ...contractFilter,
        roomId: roomId || undefined,
        room: propertyId ? { ...roomFilter, propertyId } : roomFilter,
      };
    }

    if (month) {
      where.billingMonth = month;
    }

    if (year) {
      where.billingYear = year;
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      { id: 'asc' },
    ];

    const [items, totalItems] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          invoiceNumber: true,
          billingMonth: true,
          billingYear: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          status: true,
          createdAt: true,
          contract: {
            select: {
              tenant: {
                select: {
                  fullName: true,
                },
              },
              room: {
                select: {
                  code: true,
                  property: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / take);
    const formattedItems = items.map((item) => InvoiceResponseDto.fromEntity(item));

    return {
      message: 'Get invoices successfully',
      data: {
        items: formattedItems,
        meta: {
          totalItems,
          itemCount: formattedItems.length,
          itemsPerPage: take,
          totalPages,
          currentPage: page,
        },
      },
    };
  }

  async create(ownerId: string, dto: CreateInvoiceDto) {
    const issueDate = new Date(dto.issueDate);
    const dueDate = new Date(dto.dueDate);

    // 1. Date Validation: issueDate <= dueDate
    if (issueDate > dueDate) {
      throw new BadRequestException({
        message: 'Ngày lập hóa đơn không được lớn hơn ngày đến hạn.',
        code: 'INVALID_DATE_RANGE',
      });
    }

    // 2. Fetch Contract & Validate Ownership
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: dto.contractId,
        deletedAt: null,
      },
      include: {
        tenant: true,
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!contract || contract.room.property.ownerId !== ownerId) {
      throw new NotFoundException({
        message: 'Không tìm thấy hợp đồng hoặc bạn không có quyền truy cập.',
        code: 'CONTRACT_NOT_FOUND',
      });
    }

    // 3. Contract Status
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ConflictException({
        message: 'Chỉ có thể tạo hóa đơn cho hợp đồng đang hoạt động.',
        code: 'CONTRACT_STATUS_INVALID',
      });
    }

    // 4. Billing Period Validation (Must be within contract start/end dates)
    const billingPeriodStart = new Date(dto.billingYear, dto.billingMonth - 1, 1);
    const billingPeriodEnd = new Date(dto.billingYear, dto.billingMonth, 0); // Last day of month
    
    // Contract period overlaps with billing period if:
    // contract.startDate <= billingPeriodEnd AND contract.endDate >= billingPeriodStart
    if (contract.startDate > billingPeriodEnd || contract.endDate < billingPeriodStart) {
      throw new BadRequestException({
        message: 'Kỳ hóa đơn không nằm trong thời gian hiệu lực của hợp đồng.',
        code: 'INVALID_BILLING_PERIOD',
      });
    }

    // 5. Amount Calculation
    const roomRent = Number(contract.monthlyRent);
    const totalAmount =
      roomRent +
      dto.electricityAmount +
      dto.waterAmount +
      dto.serviceAmount +
      dto.otherAmount -
      dto.discountAmount;

    if (totalAmount < 0) {
      throw new BadRequestException({
        message: 'Tổng tiền hóa đơn không hợp lệ (nhỏ hơn 0).',
        code: 'INVALID_TOTAL_AMOUNT',
      });
    }

    // Retry loop for unique generation and race condition prevention
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // 6. Check Duplicate Invoice via code (will also rely on DB Unique Constraint for absolute safety)
        const existingInvoice = await this.prisma.invoice.findFirst({
          where: {
            contractId: dto.contractId,
            billingMonth: dto.billingMonth,
            billingYear: dto.billingYear,
            deletedAt: null,
          },
        });

        if (existingInvoice) {
          throw new ConflictException({
            message: 'Hóa đơn cho kỳ này đã tồn tại.',
            code: 'INVOICE_ALREADY_EXISTS',
          });
        }

        // 7. Generate Invoice Number: INV-YYYYMM-XXXX
        const prefix = `INV-${dto.billingYear}${dto.billingMonth.toString().padStart(2, '0')}-`;
        
        // Find last invoice number with this prefix
        const lastInvoice = await this.prisma.invoice.findFirst({
          where: {
            invoiceNumber: {
              startsWith: prefix,
            },
          },
          orderBy: {
            invoiceNumber: 'desc',
          },
        });

        let nextSequence = 1;
        if (lastInvoice) {
          const lastSequenceStr = lastInvoice.invoiceNumber.replace(prefix, '');
          const lastSequence = parseInt(lastSequenceStr, 10);
          if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
          }
        }
        
        const invoiceNumber = `${prefix}${nextSequence.toString().padStart(4, '0')}`;

        // 8. Transaction: Create Invoice + AuditLog
        const result = await this.prisma.$transaction(async (tx) => {
          const newInvoice = await tx.invoice.create({
            data: {
              contractId: dto.contractId,
              invoiceNumber,
              billingMonth: dto.billingMonth,
              billingYear: dto.billingYear,
              issueDate: issueDate,
              dueDate: dueDate,
              roomRent: roomRent,
              electricityAmount: dto.electricityAmount,
              waterAmount: dto.waterAmount,
              serviceAmount: dto.serviceAmount,
              otherAmount: dto.otherAmount,
              discountAmount: dto.discountAmount,
              totalAmount: totalAmount,
              paidAmount: 0,
              status: InvoiceStatus.UNPAID,
              note: dto.note,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: ownerId,
              action: AuditAction.INVOICE_CREATED,
              entity: 'Invoice',
              entityId: newInvoice.id,
              metadata: {
                invoiceId: newInvoice.id,
                invoiceNumber: newInvoice.invoiceNumber,
                contractId: contract.id,
                tenantId: contract.tenantId,
                roomId: contract.roomId,
                propertyId: contract.room.propertyId,
                billingMonth: newInvoice.billingMonth,
                billingYear: newInvoice.billingYear,
                totalAmount: newInvoice.totalAmount,
              },
            },
          });

          return newInvoice;
        });

        // Add related entities for response mapping
        return {
          message: 'Create invoice successfully',
          data: InvoiceResponseDto.fromEntity({
            ...result,
            contract,
          }),
        };

      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // If we hit P2002, check if it's the duplicate business rule or the invoice number unique constraint
          const target = error.meta?.target as string[];
          if (target?.includes('contractId') && target?.includes('billingMonth') && target?.includes('billingYear')) {
            throw new ConflictException({
              message: 'Hóa đơn cho kỳ này đã tồn tại.',
              code: 'INVOICE_ALREADY_EXISTS',
            });
          }
          
          if (target?.includes('invoiceNumber')) {
            if (attempt === MAX_RETRIES) {
              throw new InternalServerErrorException({
                message: 'Không thể tạo mã hóa đơn do hệ thống bận, vui lòng thử lại sau.',
                code: 'GENERATE_INVOICE_NUMBER_FAILED',
              });
            }
            continue; // Retry
          }
        }
        
        throw error;
      }
    }
  }

  async getById(ownerId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        deletedAt: null,
        contract: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        billingMonth: true,
        billingYear: true,
        issueDate: true,
        dueDate: true,
        roomRent: true,
        electricityAmount: true,
        waterAmount: true,
        serviceAmount: true,
        otherAmount: true,
        discountAmount: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        contract: {
          select: {
            id: true,
            contractNumber: true,
            tenant: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
            room: {
              select: {
                id: true,
                code: true,
                name: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                    ownerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice || invoice.contract?.room?.property?.ownerId !== ownerId) {
      throw new NotFoundException({
        message: 'Không tìm thấy hóa đơn hoặc bạn không có quyền truy cập.',
        code: 'INVOICE_NOT_FOUND',
      });
    }

    const summary = await this.invoiceSummaryProvider.getSummary(invoice as unknown as Invoice);

    return {
      message: 'Get invoice details successfully',
      data: InvoiceDetailResponseDto.fromEntity(invoice, summary),
    };
  }

  /**
   * Helper function to recalculate the invoice status.
   * This can be used by both Update Invoice and Payment Module.
   */
  recalculateInvoiceStatus(totalAmount: number, paidAmount: number): InvoiceStatus {
    const remainingAmount = totalAmount - paidAmount;
    if (remainingAmount <= 0) return InvoiceStatus.PAID;
    if (remainingAmount === totalAmount) return InvoiceStatus.UNPAID;
    return InvoiceStatus.PARTIALLY_PAID;
  }

  async update(ownerId: string, id: string, dto: UpdateInvoiceDto) {
    // 1. Load Invoice & Validate Ownership & Soft Delete Check
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        deletedAt: null,
        contract: {
          deletedAt: null,
        },
      },
      include: {
        contract: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!invoice || invoice.contract.room.property.ownerId !== ownerId) {
      throw new NotFoundException({
        message: 'Không tìm thấy hóa đơn hoặc bạn không có quyền truy cập.',
        code: 'INVOICE_NOT_FOUND',
      });
    }

    // 2. Validate Invoice Status
    if (invoice.status !== InvoiceStatus.UNPAID) {
      throw new ConflictException({
        message: 'Chỉ có thể cập nhật hóa đơn khi trạng thái là chưa thanh toán.',
        code: 'INVOICE_CANNOT_UPDATE',
      });
    }

    // 3. Detect Changes (only on editable fields)
    const editableFields: (keyof UpdateInvoiceDto)[] = [
      'issueDate', 'dueDate', 'electricityAmount', 'waterAmount',
      'serviceAmount', 'otherAmount', 'discountAmount', 'note'
    ];

    const changedFields: string[] = [];
    const updateData: any = {};
    const before: any = {};
    const after: any = {};

    for (const field of editableFields) {
      if (dto[field] !== undefined) {
        let isChanged = false;
        if (field === 'issueDate' || field === 'dueDate') {
          const newDate = new Date(dto[field] as string);
          if (newDate.getTime() !== invoice[field].getTime()) {
            isChanged = true;
            updateData[field] = newDate;
          }
        } else if (field === 'note') {
          if (dto.note !== invoice.note) {
            isChanged = true;
            updateData.note = dto.note;
          }
        } else {
          // Amounts (Decimal type in Prisma comes as object or string usually, but in NestJS we can compare as Number)
          const newAmount = Number(dto[field]);
          const oldAmount = Number(invoice[field]);
          if (newAmount !== oldAmount) {
            isChanged = true;
            updateData[field] = newAmount;
          }
        }

        if (isChanged) {
          changedFields.push(field);
          before[field] = invoice[field];
          after[field] = updateData[field] !== undefined ? updateData[field] : dto[field];
        }
      }
    }

    if (changedFields.length === 0) {
      throw new BadRequestException({
        message: 'Không có dữ liệu thay đổi để cập nhật.',
        code: 'NO_FIELDS_TO_UPDATE',
      });
    }

    // 4. Validate Date
    const newIssueDate = updateData.issueDate || invoice.issueDate;
    const newDueDate = updateData.dueDate || invoice.dueDate;
    
    if (newIssueDate > newDueDate) {
      throw new BadRequestException({
        message: 'Ngày lập hóa đơn không được lớn hơn ngày đến hạn.',
        code: 'INVALID_DATE_RANGE',
      });
    }

    if (newIssueDate < invoice.contract.startDate || newDueDate > invoice.contract.endDate) {
      throw new BadRequestException({
        message: 'Ngày lập và ngày đến hạn hóa đơn phải nằm trong thời gian hiệu lực hợp đồng.',
        code: 'INVALID_DATE_RANGE_CONTRACT',
      });
    }

    // 5. Calculate new totalAmount
    const electricityAmount = updateData.electricityAmount !== undefined ? updateData.electricityAmount : Number(invoice.electricityAmount);
    const waterAmount = updateData.waterAmount !== undefined ? updateData.waterAmount : Number(invoice.waterAmount);
    const serviceAmount = updateData.serviceAmount !== undefined ? updateData.serviceAmount : Number(invoice.serviceAmount);
    const otherAmount = updateData.otherAmount !== undefined ? updateData.otherAmount : Number(invoice.otherAmount);
    const discountAmount = updateData.discountAmount !== undefined ? updateData.discountAmount : Number(invoice.discountAmount);
    const roomRent = Number(invoice.roomRent);

    const newTotalAmount = roomRent + electricityAmount + waterAmount + serviceAmount + otherAmount - discountAmount;
    
    if (newTotalAmount < 0) {
      throw new BadRequestException({
        message: 'Tổng tiền hóa đơn không hợp lệ (nhỏ hơn 0).',
        code: 'INVALID_TOTAL_AMOUNT',
      });
    }

    const paidAmount = Number(invoice.paidAmount);
    if (newTotalAmount < paidAmount) {
      throw new ConflictException({
        message: 'Tổng tiền mới không được nhỏ hơn số tiền đã thanh toán.',
        code: 'TOTAL_AMOUNT_LESS_THAN_PAID',
      });
    }

    // If totalAmount changed, add it to updateData and Audit
    if (newTotalAmount !== Number(invoice.totalAmount)) {
      updateData.totalAmount = newTotalAmount;
      before.totalAmount = invoice.totalAmount;
      after.totalAmount = newTotalAmount;
      changedFields.push('totalAmount');

      // 6. Recalculate Status
      const newStatus = this.recalculateInvoiceStatus(newTotalAmount, paidAmount);
      if (newStatus !== invoice.status) {
        updateData.status = newStatus;
        before.status = invoice.status;
        after.status = newStatus;
        changedFields.push('status');
      }
    }

    // 7. Transaction: Update Invoice & AuditLog
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          contract: {
            include: {
              tenant: true,
              room: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: AuditAction.INVOICE_UPDATED,
          entity: 'Invoice',
          entityId: updatedInvoice.id,
          metadata: {
            invoiceId: updatedInvoice.id,
            invoiceNumber: updatedInvoice.invoiceNumber,
            contractId: updatedInvoice.contractId,
            tenantId: updatedInvoice.contract.tenantId,
            roomId: updatedInvoice.contract.roomId,
            propertyId: updatedInvoice.contract.room.propertyId,
            billingMonth: updatedInvoice.billingMonth,
            billingYear: updatedInvoice.billingYear,
            before,
            after,
            changedFields,
          },
        },
      });

      return updatedInvoice;
    });
    
    // Calculate summary for the updated invoice
    const summary = await this.invoiceSummaryProvider.getSummary(result as unknown as Invoice);

    return {
      message: 'Invoice updated successfully',
      data: InvoiceDetailResponseDto.fromEntity(result, summary),
    };
  }

  async remove(ownerId: string, id: string) {
    // 1. Load Invoice & Validate Ownership & Check Soft Delete
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        deletedAt: null,
        contract: {
          deletedAt: null,
        },
      },
      include: {
        contract: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!invoice || invoice.contract.room.property.ownerId !== ownerId) {
      throw new NotFoundException({
        message: 'Không tìm thấy hóa đơn hoặc bạn không có quyền truy cập.',
        code: 'INVOICE_NOT_FOUND',
      });
    }

    // 2. Validate Status
    if (invoice.status !== InvoiceStatus.UNPAID) {
      throw new ConflictException({
        message: 'Không thể xóa hóa đơn ở trạng thái hiện tại (Chỉ có thể xóa hóa đơn Chưa thanh toán).',
        code: 'INVOICE_CANNOT_DELETE',
      });
    }

    // 3. Payment Dependency Check
    const canDelete = await this.invoiceDeletionPolicy.canDelete(id);
    if (!canDelete) {
      throw new ConflictException({
        message: 'Không thể xóa hóa đơn do có ràng buộc thanh toán.',
        code: 'INVOICE_CANNOT_DELETE',
      });
    }

    // 4. Transaction: Soft Delete + Audit Log
    await this.prisma.$transaction(async (tx) => {
      const deletedAt = new Date();
      
      await tx.invoice.update({
        where: { id },
        data: { deletedAt },
      });

      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: AuditAction.INVOICE_DELETED,
          entity: 'Invoice',
          entityId: invoice.id,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            contractId: invoice.contractId,
            tenantId: invoice.contract.tenantId,
            roomId: invoice.contract.roomId,
            propertyId: invoice.contract.room.propertyId,
            billingMonth: invoice.billingMonth,
            billingYear: invoice.billingYear,
            totalAmount: Number(invoice.totalAmount),
            status: invoice.status,
            deletedAt: deletedAt.toISOString(),
          },
        },
      });
    });

    return {
      message: 'Invoice deleted successfully',
      data: null,
    };
  }
}
