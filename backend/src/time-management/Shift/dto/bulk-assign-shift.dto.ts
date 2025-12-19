import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class BulkAssignShiftDto {
  @IsString()
  shiftTemplateId: string; // Shift template to assign

  // One of these must be provided for bulk assignment
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ValidateIf((o) => !o.departmentId && !o.positionId)
  employeeIds?: string[]; // Array of employee IDs

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.employeeIds && !o.positionId)
  departmentId?: string; // Assign to all employees in department

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.employeeIds && !o.departmentId)
  positionId?: string; // Assign to all employees with this position

  @IsDateString()
  effectiveFrom: string; // When assignments start (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)

  @IsDateString()
  @IsOptional()
  effectiveTo?: string | null; // When assignments end (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ, null = indefinite)

  @IsString()
  assignedBy: string; // Employee ID of who made the assignment

  @IsString()
  @IsOptional()
  reason?: string; // Reason for bulk assignment
}
