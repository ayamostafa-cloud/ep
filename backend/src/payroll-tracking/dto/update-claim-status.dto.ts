import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus } from '../enums/payroll-tracking-enum';

export class UpdateClaimStatusDto {
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  approvedAmount?: number;

  @IsOptional()
  rejectionReason?: string; 

  @IsOptional()
  resolutionComment?: string;
}

