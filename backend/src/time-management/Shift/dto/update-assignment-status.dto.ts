import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAssignmentStatusDto {
  @IsEnum(['Active', 'Inactive', 'Cancelled', 'Approved', 'Expired'])
  status: string; // New status for the assignment

  @IsString()
  @IsOptional()
  reason?: string; // Optional reason for status change
}
