import { Injectable } from '@nestjs/common';

/**
 * Abstraction for checking if a room can be deleted.
 * This is used to decouple the Room Module from the Contract Module.
 */
export abstract class RoomUsageChecker {
  abstract canDeleteRoom(roomId: string): Promise<boolean>;
}

@Injectable()
export class DefaultRoomUsageChecker implements RoomUsageChecker {
  /**
   * Temporary implementation for Room Deletion Policy.
   * Currently, it always allows deletion (returns true).
   * This implementation WILL BE REPLACED by the Contract Module
   * once it is implemented to ensure data consistency.
   */
  async canDeleteRoom(roomId: string): Promise<boolean> {
    return true;
  }
}
