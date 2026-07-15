import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PropertyStatus, PropertyType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => {
    const trimmed = value?.trim();
    return trimmed === '' ? null : trimmed;
  })
  description?: string;
}
