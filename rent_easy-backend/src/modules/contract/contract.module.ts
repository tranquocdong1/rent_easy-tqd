import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { ContractSchedulerService } from './contract-scheduler.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CONTRACT_DELETION_POLICY, DefaultContractDeletionPolicy } from './policies/contract-deletion.policy';
import { CONTRACT_SUMMARY_PROVIDER, DefaultContractSummaryProvider } from './providers/contract-summary.provider';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ContractController],
  providers: [
    ContractService,
    ContractSchedulerService,
    {
      provide: CONTRACT_DELETION_POLICY,
      useClass: DefaultContractDeletionPolicy,
    },
    {
      provide: CONTRACT_SUMMARY_PROVIDER,
      useClass: DefaultContractSummaryProvider,
    },
  ],
})
export class ContractModule {}
