import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CONTRACT_DELETION_POLICY, DefaultContractDeletionPolicy } from './policies/contract-deletion.policy';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ContractController],
  providers: [
    ContractService,
    {
      provide: CONTRACT_DELETION_POLICY,
      useClass: DefaultContractDeletionPolicy,
    },
  ],
})
export class ContractModule {}
