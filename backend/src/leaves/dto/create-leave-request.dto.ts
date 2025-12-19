import { IsString, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsString()
  employeeId: string;

  @IsString()
  leaveTypeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  justification?: string;

  @IsString()
  @IsOptional()
  attachmentId?: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
