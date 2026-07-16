import { Room, RoomStatus } from '@prisma/client';

export class RoomResponseDto {
  id: string;
  code: string;
  name: string;
  floor: number | null;
  area: number;
  capacity: number;
  rentPrice: number;
  deposit: number;
  status: RoomStatus;
  createdAt: Date;

  static fromEntity(entity: Room): RoomResponseDto {
    const dto = new RoomResponseDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.floor = entity.floor;
    dto.area = Number(entity.area);
    dto.capacity = entity.capacity;
    dto.rentPrice = Number(entity.rentPrice);
    dto.deposit = Number(entity.deposit);
    dto.status = entity.status;
    dto.createdAt = entity.createdAt;
    // Dropping updatedAt as per the user's latest requirement
    return dto;
  }
}
