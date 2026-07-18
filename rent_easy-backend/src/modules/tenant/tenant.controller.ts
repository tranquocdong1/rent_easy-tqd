import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { GetTenantsQueryDto } from './dto/get-tenants.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
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

  @Get(':id')
  @Roles(Role.OWNER)
  async getTenantById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.tenantService.getTenantById(user.id, id);
    return {
      message: 'Lấy chi tiết người thuê thành công',
      data,
    };
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  async updateTenant(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    const data = await this.tenantService.updateTenant(user.id, id, dto);
    return {
      message: 'Cập nhật người thuê thành công',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  async deleteTenant(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.tenantService.deleteTenant(user.id, id);
    return {
      message: 'Xóa người thuê thành công',
      data: null,
    };
  }
}
