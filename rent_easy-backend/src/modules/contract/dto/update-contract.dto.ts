import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contractNumber?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
