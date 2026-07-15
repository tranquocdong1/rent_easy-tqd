import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PropertyQueryDto } from './dto/property-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(ownerId: string, query: PropertyQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query;

    // Ensure limit is at most 50
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const where: Prisma.PropertyWhereInput = {
      ownerId,
      deletedAt: null, // Soft delete condition
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      propertyType: item.propertyType,
      status: item.status,
      address: item.address,
      roomCount: 0, // Mock for now, will use _count.rooms later
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
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
      message: 'Success',
    };
  }
}
