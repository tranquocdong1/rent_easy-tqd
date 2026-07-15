import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PropertyStatus, PropertyType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(PropertyType)
  @IsNotEmpty()
  propertyType: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus = PropertyStatus.ACTIVE;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => {
    const trimmed = value?.trim();
    return trimmed === '' ? null : trimmed;
  })
  description?: string;
}
