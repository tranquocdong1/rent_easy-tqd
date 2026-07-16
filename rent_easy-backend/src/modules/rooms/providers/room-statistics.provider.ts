import { Injectable } from '@nestjs/common';

export interface RoomStatistics {
  activeContracts: number;
  currentTenants: number;
  unpaidInvoices: number;
}

export abstract class RoomStatisticsProvider {
  abstract getRoomStats(roomId: string): Promise<RoomStatistics>;
}

@Injectable()
export class DummyRoomStatisticsProvider implements RoomStatisticsProvider {
  /**
   * Dummy implementation for Room Statistics.
   * Will be replaced by Contract/Tenant/Invoice providers in the future.
   */
  async getRoomStats(roomId: string): Promise<RoomStatistics> {
    return {
      activeContracts: 0,
      currentTenants: 0,
      unpaidInvoices: 0,
    };
  }
}
