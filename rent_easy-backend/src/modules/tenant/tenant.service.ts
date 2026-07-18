import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetTenantsQueryDto, SortOrder, TenantSortBy } from './dto/get-tenants.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Prisma, AuditAction } from '@prisma/client';
import { TENANT_DELETION_POLICY, type TenantDeletionPolicy } from './policies/tenant-deletion.policy';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TENANT_DELETION_POLICY)
    private readonly deletionPolicy: TenantDeletionPolicy,
  ) {}

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

  async createTenant(ownerId: string, dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findFirst({
      where: {
        ownerId,
        identityNumber: dto.identityNumber,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('IDENTITY_NUMBER_ALREADY_EXISTS');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            ownerId,
            ...dto,
            dateOfBirth: dto.dateOfBirth || null,
            identityIssuedDate: dto.identityIssuedDate || null,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: ownerId,
            action: AuditAction.TENANT_CREATED,
            entity: 'Tenant',
            entityId: tenant.id,
            metadata: {
              tenantId: tenant.id,
              tenantName: tenant.fullName,
              identityNumber: tenant.identityNumber,
            },
          },
        });

        return tenant;
      });

      // Omit ownerId before returning
      const { ownerId: _, ...tenantData } = result;
      return tenantData;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('IDENTITY_NUMBER_ALREADY_EXISTS');
        }
      }
      throw error;
    }
  }

  async getTenantById(ownerId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, ownerId, deletedAt: null },
    });
    if (!tenant) {
      throw new ConflictException('TENANT_NOT_FOUND');
    }
    return tenant;
  }

  async updateTenant(ownerId: string, tenantId: string, dto: UpdateTenantDto) {
    const existing = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        ownerId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new ConflictException('TENANT_NOT_FOUND');
    }

    // Prepare update data
    const updateData: Record<string, any> = {};
    const changedFields: string[] = [];
    const before: Record<string, any> = {};
    const after: Record<string, any> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        // Compare with existing
        const existingValue = existing[key as keyof typeof existing];
        let isEqual = false;

        if (value instanceof Date && existingValue instanceof Date) {
          isEqual = value.getTime() === existingValue.getTime();
        } else {
          isEqual = value === existingValue;
        }

        if (!isEqual) {
          updateData[key] = value;
          changedFields.push(key);
          before[key] = existingValue;
          after[key] = value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new ConflictException('NO_FIELDS_TO_UPDATE');
    }

    if (updateData.identityNumber) {
      const duplicate = await this.prisma.tenant.findFirst({
        where: {
          ownerId,
          identityNumber: updateData.identityNumber,
          deletedAt: null,
          id: { not: tenantId },
        },
      });
      if (duplicate) {
        throw new ConflictException('IDENTITY_NUMBER_ALREADY_EXISTS');
      }
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.update({
          where: { id: tenantId },
          data: updateData,
        });

        await tx.auditLog.create({
          data: {
            userId: ownerId,
            action: AuditAction.TENANT_UPDATED,
            entity: 'Tenant',
            entityId: tenant.id,
            metadata: {
              tenantId: tenant.id,
              changedFields,
              before,
              after,
            },
          },
        });

        return tenant;
      });

      const { ownerId: _, ...tenantData } = result;
      return tenantData;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('IDENTITY_NUMBER_ALREADY_EXISTS');
        }
      }
      throw error;
    }
  }

  async deleteTenant(ownerId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        ownerId,
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new ConflictException('TENANT_NOT_FOUND');
    }

    const deletionCheck = await this.deletionPolicy.canDelete(tenantId);
    if (!deletionCheck.allowed) {
      throw new ConflictException(deletionCheck.reason || 'TENANT_IN_USE');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          deletedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: AuditAction.TENANT_DELETED,
          entity: 'Tenant',
          entityId: tenant.id,
          metadata: {
            tenantId: tenant.id,
            tenantName: tenant.fullName,
            identityNumber: tenant.identityNumber,
          },
        },
      });
    });
  }
}
