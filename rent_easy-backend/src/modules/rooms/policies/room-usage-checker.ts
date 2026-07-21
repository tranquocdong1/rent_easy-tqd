import { Injectable } from '@nestjs/common';

/**
 * Abstraction for checking if a room can be deleted.
 * This is used to decouple the Room Module from the Contract Module.
 */
export abstract class RoomUsageChecker {
  abstract canDeleteRoom(roomId: string): Promise<boolean>;
}
