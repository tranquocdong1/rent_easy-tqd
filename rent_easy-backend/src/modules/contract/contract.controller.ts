import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ContractService } from './contract.service';
import { GetContractsDto } from './dto/get-contracts.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('v1/contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  async getContracts(@CurrentUser('id') userId: string, @Query() query: GetContractsDto) {
    return this.contractService.getContracts(userId, query);
  }

  @Post()
  async createContract(@CurrentUser('id') userId: string, @Body() body: CreateContractDto) {
    return this.contractService.createContract(userId, body);
  }
}
