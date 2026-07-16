import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface PropertyStatistics {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
}

@Injectable()
export class PropertyStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(propertyId: string): Promise<PropertyStatistics> {
    // TODO: Implement actual room counting logic when Room module is ready.
    // For now, return mock data.
    return {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
    };
  }
}
