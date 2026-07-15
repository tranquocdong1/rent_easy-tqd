import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PropertyQueryDto } from './dto/property-query.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyResponseDto } from './dto/property-response.dto';
import { AuditAction, Prisma, PropertyStatus } from '@prisma/client';

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

    const formattedItems = items.map((item) => PropertyResponseDto.fromEntity(item, 0));

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

  async create(ownerId: string, createPropertyDto: CreatePropertyDto) {
    // Check if name already exists for this owner (not soft deleted)
    const existingProperty = await this.prisma.property.findFirst({
      where: {
        ownerId,
        name: createPropertyDto.name,
        deletedAt: null,
      },
    });

    if (existingProperty) {
      throw new ConflictException({
        message: 'Property đã tồn tại. Vui lòng chọn tên khác.',
        code: 'PROPERTY_ALREADY_EXISTS',
      });
    }

    try {
      const property = await this.prisma.$transaction(async (tx) => {
        const newProperty = await tx.property.create({
          data: {
            ...createPropertyDto,
            status: createPropertyDto.status ?? PropertyStatus.ACTIVE,
            ownerId,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: ownerId,
            action: AuditAction.PROPERTY_CREATED,
            entity: 'Property',
            entityId: newProperty.id,
            metadata: {
              propertyId: newProperty.id,
              propertyName: newProperty.name,
            },
          },
        });

        return newProperty;
      });

      return {
        message: 'Property created successfully',
        data: PropertyResponseDto.fromEntity(property, 0),
      };
    } catch (error) {
      // Handle Prisma P2002 Unique Constraint violation just in case of race condition
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException({
            message: 'Property đã tồn tại. Vui lòng chọn tên khác.',
            code: 'PROPERTY_ALREADY_EXISTS',
          });
        }
      }
      throw error;
    }
  }
}
