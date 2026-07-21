import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { Prisma } from '@prisma/client';

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
}
