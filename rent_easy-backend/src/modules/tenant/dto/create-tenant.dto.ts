import { IsEnum, IsOptional, IsString, Matches, IsNotEmpty, IsDateString, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '@prisma/client';

export function NormalizeString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim().replace(/\s+/g, ' ');
      return trimmed === '' ? null : trimmed;
    }
    return value;
  });
}

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  @NormalizeString()
  fullName: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(\d{9}|\d{12})$/, { message: 'CCCD phải là 9 hoặc 12 số' })
  @NormalizeString()
  identityNumber: string;

  @IsOptional()
  @IsDateString()
  identityIssuedDate?: string;

  @IsOptional()
  @IsString()
  @NormalizeString()
  identityIssuedPlace?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Số điện thoại phải từ 10-11 số' })
  @NormalizeString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @NormalizeString()
  email?: string;

  @IsOptional()
  @IsString()
  @NormalizeString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  @NormalizeString()
  note?: string;
}
