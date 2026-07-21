import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class TerminateContractDto {
  @IsDateString()
  terminatedDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return value;
  })
  reason?: string | null;
}
