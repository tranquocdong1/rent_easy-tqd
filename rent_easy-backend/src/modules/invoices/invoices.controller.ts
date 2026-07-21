import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
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

  @Get()
  findAll(@CurrentUser('id') ownerId: string, @Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(ownerId, query);
  }
}
