import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RoomUsageChecker } from '../../rooms/policies/room-usage-checker';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class ContractRoomUsageChecker implements RoomUsageChecker {
  constructor(private readonly prisma: PrismaService) {}

  async canDeleteRoom(roomId: string): Promise<boolean> {
    const contract = await this.prisma.contract.findFirst({
      where: {
        roomId,
        deletedAt: null,
        status: { in: [ContractStatus.ACTIVE, ContractStatus.PENDING] },
      },
      select: { id: true },
    });
    
    return !contract;
  }
}
