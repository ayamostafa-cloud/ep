import { IsString, IsDateString, IsOptional } from 'class-validator';

export class QueryAssignmentsDto {
  @IsString()
  @IsOptional()
  employeeId?: string; // Filter by employee

  @IsString()
  @IsOptional()
  departmentId?: string; // Filter by department

  @IsString()
  @IsOptional()
  positionId?: string; // Filter by position

  @IsString()
  @IsOptional()
  shiftTemplateId?: string; // Filter by shift template

  @IsDateString()
  @IsOptional()
  from?: string; // Start date for calendar view (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)

  @IsDateString()
  @IsOptional()
  to?: string; // End date for calendar view (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)

  @IsString()
  @IsOptional()
  status?: string; // Filter by status (Active, Inactive, Cancelled)
}
