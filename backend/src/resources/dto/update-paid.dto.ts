import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class UpdatePaidDto {
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsDateString()
  @IsOptional()
  paidUntil?: string;
}

