import { Injectable } from '@nestjs/common';

export const TENANT_DELETION_POLICY = 'TENANT_DELETION_POLICY';

export interface TenantDeletionPolicy {
  canDelete(tenantId: string): Promise<{ allowed: boolean; reason?: string }>;
}

@Injectable()
export class DefaultTenantDeletionPolicy implements TenantDeletionPolicy {
  async canDelete(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true };
  }
}
