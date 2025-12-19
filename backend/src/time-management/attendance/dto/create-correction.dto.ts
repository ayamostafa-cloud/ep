import { IsString, IsDate, IsOptional } from 'class-validator';

export class CreateCorrectionDto {
  @IsString()
  attendanceRecordId: string;

  @IsString()
  employeeId: string;

  @IsOptional()
  @IsDate()
  correctedInTime?: Date;

  @IsOptional()
  @IsDate()
  correctedOutTime?: Date;

  @IsOptional()
  @IsString()
  reason?: string; // Reason for correction
}
