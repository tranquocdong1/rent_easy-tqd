import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoomQueryDto } from './dto/room-query.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { Prisma, AuditAction, RoomStatus } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates if property exists, belongs to owner, and is not deleted.
   * Reusable for other features.
   */
  async validatePropertyOwnership(ownerId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new NotFoundException({
        message: 'Không tìm thấy tài sản hoặc đã bị xóa.',
        code: 'PROPERTY_NOT_FOUND',
      });
    }

    return property;
  }

  /**
   * Normalize room data before creating/updating.
   * Uniformly upper cases code and handles description.
   */
  normalizeRoomData(data: Partial<CreateRoomDto> | UpdateRoomDto) {
    const normalized = { ...data };
    
    if (normalized.code) {
      normalized.code = normalized.code.trim().toUpperCase();
    }
    
    if (normalized.name) {
      normalized.name = normalized.name.trim();
    }

    if (normalized.description !== undefined) {
      const desc = typeof normalized.description === 'string' ? normalized.description.trim() : null;
      normalized.description = desc === '' ? null : desc;
    }

    return normalized;
  }

  /**
   * Validates duplicate code in the same property.
   */
  async validateDuplicateCode(propertyId: string, code: string, excludeRoomId?: string) {
    const existing = await this.prisma.room.findFirst({
      where: {
        propertyId,
        code,
        deletedAt: null,
        ...(excludeRoomId ? { id: { not: excludeRoomId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException({
        message: 'Mã phòng đã tồn tại trong tài sản này.',
        code: 'ROOM_ALREADY_EXISTS',
      });
    }
  }

  async findAll(ownerId: string, propertyId: string, query: RoomQueryDto) {
    await this.validatePropertyOwnership(ownerId, propertyId);

    // 2. Process query params
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Validate sortBy whitelist
    const allowedSortFields = ['code', 'name', 'rentPrice', 'area', 'floor', 'createdAt'];
    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Trường sắp xếp không hợp lệ.',
        code: 'BAD_REQUEST',
      });
    }

    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const where: Prisma.RoomWhereInput = {
      propertyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Stable sort by adding id as secondary sort
    const orderBy: Prisma.RoomOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      { id: 'asc' },
    ];

    // 3. Query database
    const [items, totalItems] = await Promise.all([
      this.prisma.room.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.room.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / take);
    const formattedItems = items.map((item) => RoomResponseDto.fromEntity(item));

    // 4. Return standard response
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
      }
    };
  }

  async create(ownerId: string, propertyId: string, createRoomDto: CreateRoomDto) {
    // 1. Validate property
    await this.validatePropertyOwnership(ownerId, propertyId);

    // 2. Validate logic for status
    if (createRoomDto.status === RoomStatus.OCCUPIED) {
      throw new BadRequestException({
        message: 'Không thể tạo phòng với trạng thái đang cho thuê (OCCUPIED).',
        code: 'BAD_REQUEST',
      });
    }

    // 3. Normalize data
    const normalizedData = this.normalizeRoomData(createRoomDto) as CreateRoomDto;

    // 4. Validate duplicate code
    await this.validateDuplicateCode(propertyId, normalizedData.code);

    try {
      // 5. Transaction
      const room = await this.prisma.$transaction(async (tx) => {
        const newRoom = await tx.room.create({
          data: {
            ...normalizedData,
            status: normalizedData.status || RoomStatus.AVAILABLE,
            propertyId,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: ownerId,
            action: AuditAction.ROOM_CREATED,
            entity: 'Room',
            entityId: newRoom.id,
            metadata: {
              roomId: newRoom.id,
              roomCode: newRoom.code,
              propertyId,
            },
          },
        });

        return newRoom;
      });

      return {
        message: 'Room created successfully',
        data: RoomResponseDto.fromEntity(room),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          message: 'Mã phòng đã tồn tại trong tài sản này.',
          code: 'ROOM_ALREADY_EXISTS',
        });
      }
      throw error;
    }
  }

  async findOne(ownerId: string, id: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        property: true,
      }
    });

    if (!room || room.property.ownerId !== ownerId) {
      throw new NotFoundException({
        message: 'Không tìm thấy phòng.',
        code: 'ROOM_NOT_FOUND',
      });
    }

    return {
      message: 'Success',
      data: RoomResponseDto.fromEntity(room),
    };
  }

  async update(ownerId: string, id: string, updateRoomDto: UpdateRoomDto) {
    if (Object.keys(updateRoomDto).length === 0) {
      throw new BadRequestException({
        message: 'Không có dữ liệu để cập nhật.',
        code: 'NO_FIELDS_TO_UPDATE',
      });
    }

    // 1. Validate room existence
    const existingRoom = await this.prisma.room.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingRoom) {
      throw new NotFoundException({
        message: 'Không tìm thấy phòng.',
        code: 'ROOM_NOT_FOUND',
      });
    }

    // 2. Validate property ownership
    await this.validatePropertyOwnership(ownerId, existingRoom.propertyId);

    // 3. Normalize new data
    const normalizedData = this.normalizeRoomData(updateRoomDto) as UpdateRoomDto;

    // 4. Filter only changed fields
    const changedFields: any = {};
    for (const key of Object.keys(normalizedData)) {
      if ((normalizedData as any)[key] !== (existingRoom as any)[key]) {
        changedFields[key] = (normalizedData as any)[key];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      throw new BadRequestException({
        message: 'Không có thay đổi nào so với dữ liệu hiện tại.',
        code: 'NO_FIELDS_TO_UPDATE',
      });
    }

    // 5. Validate duplicate code if code changed
    if (changedFields.code) {
      await this.validateDuplicateCode(existingRoom.propertyId, changedFields.code, id);
    }

    try {
      // 6. Transaction
      const room = await this.prisma.$transaction(async (tx) => {
        const updatedRoom = await tx.room.update({
          where: { id },
          data: changedFields,
        });

        // Compute before/after for audit (only changed fields)
        const before: any = {};
        const after: any = {};
        for (const key of Object.keys(changedFields)) {
          before[key] = (existingRoom as any)[key];
          after[key] = (updatedRoom as any)[key];
        }

        await tx.auditLog.create({
          data: {
            userId: ownerId,
            action: AuditAction.ROOM_UPDATED,
            entity: 'Room',
            entityId: id,
            metadata: {
              roomId: id,
              roomCode: updatedRoom.code,
              propertyId: existingRoom.propertyId,
              changes: { before, after },
            },
          },
        });

        return updatedRoom;
      });

      return {
        message: 'Room updated successfully',
        data: RoomResponseDto.fromEntity(room),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          message: 'Mã phòng đã tồn tại trong tài sản này.',
          code: 'ROOM_ALREADY_EXISTS',
        });
      }
      throw error;
    }
  }
}
