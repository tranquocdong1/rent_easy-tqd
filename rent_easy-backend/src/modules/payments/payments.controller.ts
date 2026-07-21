import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GetPaymentsDto } from './dto/get-payments.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@CurrentUser('id') ownerId: string, @Query() query: GetPaymentsDto) {
    return this.paymentsService.findAll(ownerId, query);
  }

  @Post()
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(ownerId, dto);
  }
}
