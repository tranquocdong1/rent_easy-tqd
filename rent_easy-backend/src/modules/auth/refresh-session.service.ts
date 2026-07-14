import { Injectable } from '@nestjs/common';
import { Prisma, RefreshSessionRevokeReason } from '@prisma/client';

@Injectable()
export class RefreshSessionService {
  async createSession(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    return tx.refreshSession.create({ data });
  }

  async findById(tx: Prisma.TransactionClient, id: string) {
    return tx.refreshSession.findUnique({ where: { id } });
  }

  async revokeAllUserSessions(
    tx: Prisma.TransactionClient,
    userId: string,
    reason: RefreshSessionRevokeReason
  ) {
    return tx.refreshSession.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedReason: reason,
        revokedAt: new Date(),
      },
    });
  }

  async revokeSession(
    tx: Prisma.TransactionClient,
    id: string,
    reason: RefreshSessionRevokeReason
  ) {
    return tx.refreshSession.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedReason: reason,
        revokedAt: new Date(),
      },
    });
  }

  async updateSessionOnRefresh(
    tx: Prisma.TransactionClient,
    id: string,
    newTokenHash: string,
    newRotationCounter: number,
  ) {
    const now = new Date();
    return tx.refreshSession.update({
      where: { id },
      data: {
        tokenHash: newTokenHash,
        rotationCounter: newRotationCounter,
        rotatedAt: now,
        lastUsedAt: now,
      },
    });
  }
}
