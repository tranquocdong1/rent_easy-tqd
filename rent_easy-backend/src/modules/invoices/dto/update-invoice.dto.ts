import { IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  electricityAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  waterAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  serviceAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  otherAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  note?: string;
}
