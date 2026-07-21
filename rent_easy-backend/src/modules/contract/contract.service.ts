import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetContractsDto } from './dto/get-contracts.dto';
import { ContractListItemDto } from './dto/contract-list-item.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { Prisma, AuditAction } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';
import { AuditService } from '../audit/audit.service';
import { Inject } from '@nestjs/common';
import { CONTRACT_DELETION_POLICY, type ContractDeletionPolicy } from './policies/contract-deletion.policy';
import { CONTRACT_SUMMARY_PROVIDER, type ContractSummaryProvider } from './providers/contract-summary.provider';

@Injectable()
export class ContractService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    @Inject(CONTRACT_DELETION_POLICY) private deletionPolicy: ContractDeletionPolicy,
    @Inject(CONTRACT_SUMMARY_PROVIDER) private summaryProvider: ContractSummaryProvider,
  ) {}

  async createContract(userId: string, dto: CreateContractDto) {
    const { tenantId, roomId, contractNumber, startDate, endDate, monthlyRent, depositAmount } = dto;

    const now = new Date();
    // Normalize dates for comparison (ignoring time component for "today")
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (startDateNormalized >= endDateNormalized) {
      throw new BadRequestException('Ngày kết thúc phải lớn hơn ngày bắt đầu.');
    }

    if (endDateNormalized <= today) {
      throw new BadRequestException('Ngày kết thúc phải lớn hơn ngày hiện tại.');
    }

    // Check Room and Tenant authorization
    const [room, tenant] = await Promise.all([
      this.prisma.room.findFirst({
        where: { id: roomId, property: { ownerId: userId } },
        include: { property: true },
      }),
      this.prisma.tenant.findFirst({
        where: { id: tenantId, ownerId: userId },
      })
    ]);

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng hoặc bạn không có quyền.');
    }
    if (!tenant) {
      throw new NotFoundException('Không tìm thấy khách thuê hoặc bạn không có quyền.');
    }

    // Check conflict: Room must not have PENDING or ACTIVE contract
    const conflictContract = await this.prisma.contract.findFirst({
      where: {
        roomId,
        status: { in: ['PENDING', 'ACTIVE'] },
        deletedAt: null,
      }
    });

    if (conflictContract) {
      throw new ConflictException(`Phòng này đang có một hợp đồng (${conflictContract.contractNumber}) ở trạng thái ${conflictContract.status}.`);
    }

    try {
      const contract = await this.prisma.contract.create({
        data: {
          tenantId,
          roomId,
          contractNumber,
          startDate,
          endDate,
          monthlyRent,
          depositAmount,
          status: 'PENDING'
        },
        include: {
          tenant: { select: { fullName: true } },
          room: { select: { code: true } }
        }
      });

      await this.auditService.logEvent(
        userId,
        AuditAction.CONTRACT_CREATED,
        {
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          tenantId: contract.tenantId,
          roomId: contract.roomId,
          propertyId: room.propertyId,
        },
        'Contract',
        contract.id
      );

      return {
        message: 'Create contract successfully',
        data: {
          ...contract,
          tenantName: contract.tenant.fullName,
          roomCode: contract.room.code
        }
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Số hợp đồng này đã tồn tại trong hệ thống.');
        }
      }
      throw error;
    }
  }

  async getContractDetail(userId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id,
        deletedAt: null,
        room: {
          property: {
            ownerId: userId,
          },
        },
      },
      include: {
        tenant: { select: { id: true, fullName: true, phone: true, identityNumber: true } },
        room: { select: { id: true, code: true, name: true, property: { select: { name: true, id: true } } } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng hoặc bạn không có quyền.');
    }

    const summary = await this.summaryProvider.getSummary(id);

    return {
      message: 'Get contract detail successfully',
      data: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: Number(contract.monthlyRent),
        depositAmount: Number(contract.depositAmount),
        note: contract.note,
        tenant: contract.tenant,
        room: {
          id: contract.room.id,
          code: contract.room.code,
          name: contract.room.name,
        },
        property: contract.room.property,
        summary,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      },
    };
  }

  async updateContract(userId: string, id: string, dto: UpdateContractDto) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, deletedAt: null, room: { property: { ownerId: userId } } },
      include: { room: { select: { propertyId: true } } }
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng hoặc bạn không có quyền.');
    }

    if (dto.contractNumber && dto.contractNumber !== contract.contractNumber) {
      const duplicate = await this.prisma.contract.findFirst({
        where: {
          contractNumber: dto.contractNumber,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException('Số hợp đồng này đã tồn tại trong hệ thống.');
      }
    }

    const newStartDate = dto.startDate ? new Date(dto.startDate) : contract.startDate;
    const newEndDate = dto.endDate ? new Date(dto.endDate) : contract.endDate;

    const startDateNormalized = new Date(newStartDate.getFullYear(), newStartDate.getMonth(), newStartDate.getDate());
    const endDateNormalized = new Date(newEndDate.getFullYear(), newEndDate.getMonth(), newEndDate.getDate());

    if (startDateNormalized >= endDateNormalized) {
      throw new BadRequestException('Ngày kết thúc phải lớn hơn ngày bắt đầu.');
    }

    const updates: Prisma.ContractUpdateInput = {};
    const beforeMeta: any = {};
    const afterMeta: any = {};
    let hasChanges = false;

    if (dto.contractNumber !== undefined && dto.contractNumber !== contract.contractNumber) {
      updates.contractNumber = dto.contractNumber;
      beforeMeta.contractNumber = contract.contractNumber;
      afterMeta.contractNumber = dto.contractNumber;
      hasChanges = true;
    }
    if (dto.startDate !== undefined && new Date(dto.startDate).getTime() !== contract.startDate.getTime()) {
      updates.startDate = dto.startDate;
      beforeMeta.startDate = contract.startDate;
      afterMeta.startDate = dto.startDate;
      hasChanges = true;
    }
    if (dto.endDate !== undefined && new Date(dto.endDate).getTime() !== contract.endDate.getTime()) {
      updates.endDate = dto.endDate;
      beforeMeta.endDate = contract.endDate;
      afterMeta.endDate = dto.endDate;
      hasChanges = true;
    }
    if (dto.monthlyRent !== undefined && Number(dto.monthlyRent) !== Number(contract.monthlyRent)) {
      updates.monthlyRent = dto.monthlyRent;
      beforeMeta.monthlyRent = Number(contract.monthlyRent);
      afterMeta.monthlyRent = dto.monthlyRent;
      hasChanges = true;
    }
    if (dto.depositAmount !== undefined && Number(dto.depositAmount) !== Number(contract.depositAmount)) {
      updates.depositAmount = dto.depositAmount;
      beforeMeta.depositAmount = Number(contract.depositAmount);
      afterMeta.depositAmount = dto.depositAmount;
      hasChanges = true;
    }
    if (dto.note !== undefined && dto.note !== contract.note) {
      updates.note = dto.note;
      beforeMeta.note = contract.note;
      afterMeta.note = dto.note;
      hasChanges = true;
    }

    if (!hasChanges) {
      throw new BadRequestException('NO_FIELDS_TO_UPDATE');
    }

    try {
      const [updatedContract] = await this.prisma.$transaction([
        this.prisma.contract.update({
          where: { id },
          data: updates,
          include: {
            tenant: { select: { fullName: true } },
            room: { select: { code: true, property: { select: { name: true } } } },
          },
        }),
        this.prisma.auditLog.create({
          data: {
            userId,
            action: AuditAction.CONTRACT_UPDATED,
            entity: 'Contract',
            entityId: id,
            metadata: {
              contractId: id,
              contractNumber: dto.contractNumber || contract.contractNumber,
              propertyId: contract.room.propertyId,
              roomId: contract.roomId,
              tenantId: contract.tenantId,
              before: beforeMeta,
              after: afterMeta,
            },
          },
        }),
      ]);

      return {
        message: 'Update contract successfully',
        data: {
          ...updatedContract,
          tenantName: updatedContract.tenant.fullName,
          roomCode: updatedContract.room.code,
          propertyName: updatedContract.room.property.name,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Số hợp đồng này đã tồn tại trong hệ thống.');
        }
      }
      throw error;
    }
  }

  async deleteContract(userId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, deletedAt: null },
      include: { room: { include: { property: true } } },
    });

    if (!contract || contract.room.property.ownerId !== userId) {
      throw new NotFoundException('Không tìm thấy hợp đồng hoặc bạn không có quyền.');
    }

    const canDelete = await this.deletionPolicy.canDelete(id);
    if (!canDelete) {
      throw new ConflictException('Không thể xoá hợp đồng vì đang được sử dụng.');
    }

    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.CONTRACT_DELETED,
          entity: 'Contract',
          entityId: id,
          metadata: {
            contractId: id,
            contractNumber: contract.contractNumber,
            roomId: contract.roomId,
            tenantId: contract.tenantId,
            propertyId: contract.room.propertyId,
          },
        },
      }),
    ]);

    return {
      message: 'Contract deleted successfully',
      data: null,
    };
  }
  private async validateRoomAvailability(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại.');
    }

    if (room.status === 'MAINTENANCE' || room.status === 'INACTIVE') {
      throw new ConflictException('Phòng đang không khả dụng (đang bảo trì hoặc ngừng hoạt động).');
    }

    return room;
  }

  async activateContract(userId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id,
        deletedAt: null,
        room: {
          deletedAt: null,
          property: {
            deletedAt: null,
            ownerId: userId,
          },
        },
      },
      include: { room: true },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng hoặc bạn không có quyền.');
    }

    if (contract.status !== 'PENDING') {
      throw new ConflictException(`Chỉ có thể kích hoạt hợp đồng ở trạng thái PENDING. Trạng thái hiện tại: ${contract.status}`);
    }

    await this.validateRoomAvailability(contract.roomId);

    const activeContract = await this.prisma.contract.findFirst({
      where: {
        roomId: contract.roomId,
        status: 'ACTIVE',
        deletedAt: null,
        id: { not: id },
      },
    });

    if (activeContract) {
      throw new ConflictException('Phòng này đã có một hợp đồng ACTIVE khác.');
    }

    try {
      const activatedContract = await this.prisma.$transaction(async (tx) => {
        const updatedContract = await tx.contract.update({
          where: { id },
          data: { status: 'ACTIVE' },
        });

        if (contract.room.status === 'AVAILABLE') {
          await tx.room.update({
            where: { id: contract.roomId },
            data: { status: 'OCCUPIED' },
          });
        }

        await tx.auditLog.create({
          data: {
            userId,
            action: AuditAction.CONTRACT_ACTIVATED,
            entity: 'Contract',
            entityId: id,
            metadata: {
              contractId: id,
              contractNumber: contract.contractNumber,
              roomId: contract.roomId,
              propertyId: contract.room.propertyId,
              tenantId: contract.tenantId,
            },
          },
        });

        return updatedContract;
      });

      return {
        message: 'Contract activated successfully',
        data: {
          id: activatedContract.id,
          status: activatedContract.status,
          activatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Đã xảy ra lỗi đồng thời khi kích hoạt hợp đồng (Race condition).');
      }
      throw error;
    }
  }

  async terminateContract(userId: string, id: string, dto: TerminateContractDto) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id,
        deletedAt: null,
        room: {
          property: {
            ownerId: userId,
          },
        },
      },
      include: { room: true },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng hoặc bạn không có quyền.');
    }

    if (contract.status !== 'ACTIVE') {
      throw new ConflictException(`Chỉ có thể chấm dứt hợp đồng đang ACTIVE. Trạng thái hiện tại: ${contract.status}`);
    }

    const terminatedDateObj = new Date(dto.terminatedDate);
    
    if (startOfDay(terminatedDateObj) < startOfDay(contract.startDate)) {
      throw new BadRequestException('Ngày chấm dứt không được nhỏ hơn ngày bắt đầu hợp đồng.');
    }

    if (terminatedDateObj > endOfDay(new Date())) {
      throw new BadRequestException('Ngày chấm dứt không được là ngày trong tương lai.');
    }

    const terminatedContract = await this.prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id },
        data: {
          status: 'TERMINATED',
          terminatedAt: terminatedDateObj,
          terminationReason: dto.reason ?? null,
        },
      });

      const activeContractsCount = await tx.contract.count({
        where: {
          roomId: contract.roomId,
          status: 'ACTIVE',
          deletedAt: null,
          id: { not: id },
        },
      });

      if (activeContractsCount === 0 && contract.room.status === 'OCCUPIED') {
        await tx.room.update({
          where: { id: contract.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CONTRACT_TERMINATED,
          entity: 'Contract',
          entityId: id,
          metadata: {
            contractId: id,
            contractNumber: contract.contractNumber,
            roomId: contract.roomId,
            propertyId: contract.room.propertyId,
            tenantId: contract.tenantId,
            terminatedAt: terminatedDateObj.toISOString(),
            terminationReason: dto.reason ?? null,
            previousStatus: 'ACTIVE',
            currentStatus: 'TERMINATED',
          },
        },
      });

      return updatedContract;
    });

    return {
      message: 'Contract terminated successfully',
      data: {
        id: terminatedContract.id,
        status: terminatedContract.status,
        terminatedAt: terminatedContract.terminatedAt,
        terminationReason: terminatedContract.terminationReason,
      },
    };
  }

  async processExpireContract(contractId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        deletedAt: null,
      },
      include: {
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!contract || contract.status !== 'ACTIVE') {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'EXPIRED' },
      });

      const activeContractsCount = await tx.contract.count({
        where: {
          roomId: contract.roomId,
          status: 'ACTIVE',
          deletedAt: null,
          id: { not: contractId },
        },
      });

      if (activeContractsCount === 0 && contract.room.status === 'OCCUPIED') {
        await tx.room.update({
          where: { id: contract.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: contract.room.property.ownerId,
          action: AuditAction.CONTRACT_EXPIRED,
          entity: 'Contract',
          entityId: contractId,
          metadata: {
            contractId,
            contractNumber: contract.contractNumber,
            roomId: contract.roomId,
            propertyId: contract.room.propertyId,
            tenantId: contract.tenantId,
            expiredAt: new Date().toISOString(),
            previousStatus: 'ACTIVE',
            currentStatus: 'EXPIRED',
          },
        },
      });
    });
  }

  async expireContracts() {
    const todayStart = startOfDay(new Date());

    const expiredContracts = await this.prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        endDate: {
          lt: todayStart,
        },
      },
      select: { id: true },
    });

    let processed = 0;
    let failed = 0;

    for (const contract of expiredContracts) {
      try {
        await this.processExpireContract(contract.id);
        processed++;
      } catch (error) {
        console.error(`Failed to expire contract ${contract.id}:`, error);
        failed++;
      }
    }

    return { processed, failed };
  }

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
      deletedAt: null,
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
