import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateContractDto {
  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @IsNotEmpty()
  @IsUUID()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  contractNumber: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  depositAmount: number;
}
