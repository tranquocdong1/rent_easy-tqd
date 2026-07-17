import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export enum TenantSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  FULL_NAME = 'fullName',
  IDENTITY_NUMBER = 'identityNumber',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetTenantsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TenantSortBy)
  sortBy?: TenantSortBy = TenantSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  // TODO: Add hasActiveContract logic when Contract Module is ready
  @IsOptional()
  hasActiveContract?: string; // Could be true/false string from query
}
