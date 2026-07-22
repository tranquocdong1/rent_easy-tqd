import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoomStatus } from '@prisma/client';

export interface PropertyStatistics {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
}

@Injectable()
export class PropertyStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(propertyId: string): Promise<PropertyStatistics> {
    const [totalRooms, availableRooms, occupiedRooms] = await Promise.all([
      this.prisma.room.count({
        where: { propertyId, deletedAt: null },
      }),
      this.prisma.room.count({
        where: { propertyId, deletedAt: null, status: RoomStatus.AVAILABLE },
      }),
      this.prisma.room.count({
        where: { propertyId, deletedAt: null, status: RoomStatus.OCCUPIED },
      }),
    ]);

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
    };
  }
}
