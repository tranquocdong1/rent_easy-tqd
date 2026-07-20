import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetContractsDto } from './dto/get-contracts.dto';
import { ContractListItemDto } from './dto/contract-list-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContractService {
  constructor(private prisma: PrismaService) {}

  async getContracts(userId: string, query: GetContractsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      propertyId,
      roomId,
      tenantId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {
      room: {
        property: {
          ownerId: userId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (propertyId) {
      // Need to maintain the structure for room relation
      where.room = {
        ...(where.room as Prisma.RoomWhereInput),
        propertyId: propertyId,
      };
    }

    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { tenant: { fullName: { contains: search, mode: 'insensitive' } } },
        { room: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const sortWhitelist = [
      'contractNumber',
      'tenantName',
      'roomCode',
      'startDate',
      'endDate',
      'monthlyRent',
      'status',
      'createdAt',
    ];

    if (sortBy && !sortWhitelist.includes(sortBy)) {
      throw new BadRequestException(`Invalid sortBy field. Allowed fields: ${sortWhitelist.join(', ')}`);
    }

    let orderBy: Prisma.ContractOrderByWithRelationInput = { [sortBy]: sortOrder };
    if (sortBy === 'tenantName') {
      orderBy = { tenant: { fullName: sortOrder } };
    } else if (sortBy === 'roomCode') {
      orderBy = { room: { code: sortOrder } };
    } else if (sortBy === 'monthlyRent' || sortBy === 'startDate' || sortBy === 'endDate' || sortBy === 'contractNumber' || sortBy === 'status' || sortBy === 'createdAt') {
      orderBy = { [sortBy]: sortOrder };
    }

    const [contracts, totalItems] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          contractNumber: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
          status: true,
          createdAt: true,
          tenant: {
            select: { fullName: true },
          },
          room: {
            select: { code: true, property: { select: { name: true } } },
          },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const items: ContractListItemDto[] = contracts.map((c) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      tenantName: c.tenant.fullName,
      roomCode: c.room.code,
      propertyName: c.room.property.name,
      startDate: c.startDate,
      endDate: c.endDate,
      monthlyRent: Number(c.monthlyRent),
      status: c.status,
      createdAt: c.createdAt,
    }));

    return {
      message: 'Get contracts successfully',
      data: {
        items,
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
