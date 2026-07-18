import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

import { TENANT_DELETION_POLICY, DefaultTenantDeletionPolicy } from './policies/tenant-deletion.policy';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [
    TenantService,
    {
      provide: TENANT_DELETION_POLICY,
      useClass: DefaultTenantDeletionPolicy,
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}
