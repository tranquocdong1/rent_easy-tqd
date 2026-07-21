import { Injectable, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { Prisma, AuditAction, InvoiceStatus, ContractStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string, query: InvoiceQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
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
}
