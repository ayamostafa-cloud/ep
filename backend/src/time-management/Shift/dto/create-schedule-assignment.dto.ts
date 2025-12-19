import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsObject,
  ValidateIf,
} from 'class-validator';

export class CreateScheduleAssignmentDto {
  @IsString()
  shiftTemplateId: string; // Shift template ID

  // One of these must be provided (employee, department, or position)
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.departmentId && !o.positionId)
  employeeId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.employeeId && !o.positionId)
  departmentId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.employeeId && !o.departmentId)
  positionId?: string;

  @IsDateString()
  effectiveFrom: string; // When assignment starts (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)

  @IsDateString()
  @IsOptional()
  effectiveTo?: string | null; // When assignment ends (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ, null = indefinite)

  @IsString()
  assignedBy: string; // Employee ID of who made the assignment

  @IsEnum(['manual', 'bulk_assignment', 'automatic'])
  @IsOptional()
  source?: string;

  @IsObject()
  @IsOptional()
  metadata?: {
    notes?: string;
    reason?: string;
    previousAssignmentId?: string;
  };
}
