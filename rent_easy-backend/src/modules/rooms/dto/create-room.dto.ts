import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { RoomStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsNumber()
  @Min(0.01) // > 0
  area: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsNumber()
  @Min(0)
  rentPrice: number;

  @IsNumber()
  @Min(0)
  deposit: number;

  @IsOptional()
  @IsEnum(RoomStatus, { message: 'Trạng thái không hợp lệ' })
  status?: RoomStatus;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  description?: string | null;
}
