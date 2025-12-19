import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLeaveEntitlementDto {
  @IsString()
  leaveTypeId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pendingDays?: number;
}
