import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetContractsDto } from './dto/get-contracts.dto';
import { ContractListItemDto } from './dto/contract-list-item.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Prisma, AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContractService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
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
        status: { in: ['PENDING', 'ACTIVE'] }
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
        room: {
          property: {
            ownerId: userId,
          },
        },
      },
      include: {
        tenant: { select: { fullName: true } },
        room: { select: { code: true, property: { select: { name: true, id: true } } } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng hoặc bạn không có quyền.');
    }

    return {
      message: 'Get contract detail successfully',
      data: {
        ...contract,
        tenantName: contract.tenant.fullName,
        roomCode: contract.room.code,
        propertyName: contract.room.property.name,
      },
    };
  }

  async updateContract(userId: string, id: string, dto: UpdateContractDto) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, room: { property: { ownerId: userId } } },
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
