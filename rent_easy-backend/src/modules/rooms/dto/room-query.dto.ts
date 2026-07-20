import { IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { RoomStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class RoomQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';
}
