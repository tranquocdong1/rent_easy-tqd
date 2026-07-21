import { IsUUID, IsInt, Min, Max, IsDateString, IsOptional, MinDate, ValidationArguments } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsUUID()
  contractId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  billingMonth: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  billingYear: number;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @Type(() => Number)
  @Min(0)
  electricityAmount: number;

  @Type(() => Number)
  @Min(0)
  waterAmount: number;

  @Type(() => Number)
  @Min(0)
  serviceAmount: number;

  @Type(() => Number)
  @Min(0)
  otherAmount: number;

  @Type(() => Number)
  @Min(0)
  discountAmount: number;

  @IsOptional()
  note?: string;
}
