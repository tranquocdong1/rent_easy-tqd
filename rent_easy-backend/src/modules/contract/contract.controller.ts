import { Controller, Get, Post, Body, Query, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { ContractService } from './contract.service';
import { GetContractsDto } from './dto/get-contracts.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
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

  @Get(':id')
  async getContractDetail(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.contractService.getContractDetail(userId, id);
  }

  @Patch(':id')
  async updateContract(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateContractDto,
  ) {
    return this.contractService.updateContract(userId, id, body);
  }

  @Delete(':id')
  async deleteContract(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.contractService.deleteContract(userId, id);
  }

  @Patch(':id/activate')
  async activateContract(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.contractService.activateContract(userId, id);
  }

  @Patch(':id/terminate')
  async terminateContract(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: TerminateContractDto,
  ) {
    return this.contractService.terminateContract(userId, id, dto);
  }
}
