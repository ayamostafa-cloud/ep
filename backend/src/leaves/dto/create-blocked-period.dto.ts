import { IsDateString, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateBlockedPeriodDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsArray()
  affectedDepartments?: string[];

  @IsOptional()
  @IsArray()
  exceptions?: string[];
}
