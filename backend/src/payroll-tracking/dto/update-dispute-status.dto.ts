import { IsEnum, IsOptional } from 'class-validator';
import { DisputeStatus } from '../enums/payroll-tracking-enum';

export class UpdateDisputeStatusDto {
  @IsEnum(DisputeStatus)
  status: DisputeStatus;

  @IsOptional()
  rejectionReason?: string;

  @IsOptional()
  resolutionComment?: string;
}
