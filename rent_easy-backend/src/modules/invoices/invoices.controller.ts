import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(ownerId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') ownerId: string, @Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(ownerId, query);
  }

  @Get(':id')
  getById(@CurrentUser('id') ownerId: string, @Param('id') id: string) {
    return this.invoicesService.getById(ownerId, id);
  }

  @Patch(':id')
  update(@CurrentUser('id') ownerId: string, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(ownerId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') ownerId: string, @Param('id') id: string) {
    return this.invoicesService.remove(ownerId, id);
  }
}
