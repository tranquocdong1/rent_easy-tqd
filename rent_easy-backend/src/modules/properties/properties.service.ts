import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PropertyQueryDto } from './dto/property-query.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
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

  async findOne(ownerId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new NotFoundException({
        message: 'Không tìm thấy tài sản.',
        code: 'PROPERTY_NOT_FOUND',
      });
    }

    return {
      message: 'Success',
      data: PropertyResponseDto.fromEntity(property, 0),
    };
  }

  async update(ownerId: string, id: string, updatePropertyDto: UpdatePropertyDto) {
    if (Object.keys(updatePropertyDto).length === 0) {
      throw new BadRequestException({
        message: 'Không có dữ liệu để cập nhật.',
        code: 'NO_FIELDS_TO_UPDATE',
      });
    }

    // Verify existence & ownership
    const existingProperty = await this.prisma.property.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
    });

    if (!existingProperty) {
      throw new NotFoundException({
        message: 'Không tìm thấy tài sản.',
        code: 'PROPERTY_NOT_FOUND',
      });
    }

    // Filter fields to find only what's changed
    const changedFields: any = {};
    for (const key of Object.keys(updatePropertyDto)) {
      if ((updatePropertyDto as any)[key] !== (existingProperty as any)[key]) {
        changedFields[key] = (updatePropertyDto as any)[key];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      throw new BadRequestException({
        message: 'Không có thay đổi nào so với dữ liệu hiện tại.',
        code: 'NO_FIELDS_TO_UPDATE',
      });
    }

    // Check unique name if name is changed
    if (changedFields.name) {
      const duplicateProperty = await this.prisma.property.findFirst({
        where: {
          ownerId,
          name: changedFields.name,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicateProperty) {
        throw new ConflictException({
          message: 'Property đã tồn tại. Vui lòng chọn tên khác.',
          code: 'PROPERTY_ALREADY_EXISTS',
        });
      }
    }

    try {
      const property = await this.prisma.$transaction(async (tx) => {
        const updatedProperty = await tx.property.update({
          where: { id },
          data: changedFields,
        });

        // Compute before/after for audit
        const before: any = {};
        const after: any = {};
        for (const key of Object.keys(changedFields)) {
          before[key] = (existingProperty as any)[key];
          after[key] = (updatedProperty as any)[key];
        }

        await tx.auditLog.create({
          data: {
            userId: ownerId,
            action: AuditAction.PROPERTY_UPDATED,
            entity: 'Property',
            entityId: id,
            metadata: {
              propertyId: id,
              propertyName: updatedProperty.name,
              before,
              after,
            },
          },
        });

        return updatedProperty;
      });

      return {
        message: 'Property updated successfully',
        data: PropertyResponseDto.fromEntity(property, 0),
      };
    } catch (error) {
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

  // TODO: Refactor this logic once the Room module is implemented
  private async canDeleteProperty(propertyId: string): Promise<boolean> {
    // Mock room count for now.
    // In the future:
    // const roomCount = await this.prisma.room.count({ where: { propertyId } });
    // return roomCount === 0;
    const roomCount = 0;
    return roomCount === 0;
  }

  async remove(ownerId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new NotFoundException({
        message: 'Không tìm thấy tài sản.',
        code: 'PROPERTY_NOT_FOUND',
      });
    }

    const canDelete = await this.canDeleteProperty(id);
    if (!canDelete) {
      throw new ConflictException({
        message: 'Property vẫn còn phòng, không thể xóa.',
        code: 'PROPERTY_HAS_ROOMS',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: AuditAction.PROPERTY_DELETED,
          entity: 'Property',
          entityId: id,
          metadata: {
            propertyId: id,
            propertyName: property.name,
          },
        },
      });
    });

    return {
      message: 'Property deleted successfully',
      data: null, // Standardized response as requested
    };
  }
}
