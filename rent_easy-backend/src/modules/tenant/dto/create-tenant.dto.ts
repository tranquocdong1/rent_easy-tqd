import { IsEnum, IsOptional, IsString, Matches, IsNotEmpty, IsEmail, MaxDate, IsDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'Ngày sinh không được ở tương lai' })
  dateOfBirth?: Date;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(\d{9}|\d{12})$/, { message: 'CCCD phải là 9 hoặc 12 số' })
  @NormalizeString()
  identityNumber: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'Ngày cấp không được ở tương lai' })
  identityIssuedDate?: Date;

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
