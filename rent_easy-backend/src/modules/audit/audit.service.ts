import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(
    userId: string,
    action: AuditAction,
    metadata?: Record<string, any>,
    entity?: string,
    entityId?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          metadata: metadata ? metadata : undefined,
          entity,
          entityId,
        },
      });
    } catch (error) {
      // In production, we might want to send this to a monitoring service (e.g. Sentry)
      console.error('Failed to write audit log:', error);
    }
  }
}
