import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PropertyStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

export class PropertyQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'name' = 'updatedAt';
}
