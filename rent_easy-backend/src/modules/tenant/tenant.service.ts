import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetTenantsQueryDto, SortOrder, TenantSortBy } from './dto/get-tenants.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenants(ownerId: string, query: GetTenantsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = TenantSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
      gender,
    } = query;
    
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {
      ownerId,
      deletedAt: null,
    };

    if (gender) {
      where.gender = gender;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { identityNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
          identityNumber: true,
          identityIssuedDate: true,
          identityIssuedPlace: true,
          phone: true,
          email: true,
          permanentAddress: true,
          note: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }
}
