import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateLeaveEntitlementDto {
  @IsString()
  employeeId: string;

  @IsString()
  leaveTypeId: string;

  @IsNumber()
  @Min(0)
  totalDays: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  carriedOverDays?: number;

  @IsNumber()
  year: number;
}
