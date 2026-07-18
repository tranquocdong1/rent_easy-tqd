import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { GetTenantsQueryDto } from './dto/get-tenants.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @Roles(Role.OWNER)
  async getTenants(
    @CurrentUser() user: any,
    @Query() query: GetTenantsQueryDto,
  ) {
    const data = await this.tenantService.getTenants(user.id, query);
    return {
      message: 'Lấy danh sách người thuê thành công',
      data,
    };
  }

  @Post()
  @Roles(Role.OWNER)
  async createTenant(
    @CurrentUser() user: any,
    @Body() dto: CreateTenantDto,
  ) {
    const data = await this.tenantService.createTenant(user.id, dto);
    return {
      message: 'Tạo người thuê thành công',
      data,
    };
  }
}
