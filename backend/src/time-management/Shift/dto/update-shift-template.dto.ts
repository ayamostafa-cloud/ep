import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class UpdateShiftTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum([
    'normal',
    'split',
    'overnight',
    'rotational',
    'flexible',
    'compressed',
  ])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restDays?: string[];

  @IsNumber()
  @Min(0)
  @Max(60)
  @IsOptional()
  gracePeriod?: number;

  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @IsString()
  @IsOptional()
  rotationalPattern?: string | null;

  @IsDateString()
  @IsOptional()
  expirationDate?: Date | null;

  @IsEnum(['Active', 'Inactive', 'Expired', 'Cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Flexible hours support
  @IsString()
  @IsOptional()
  flexibleStartWindow?: string;

  @IsString()
  @IsOptional()
  flexibleEndWindow?: string;

  @IsNumber()
  @Min(1)
  @Max(24)
  @IsOptional()
  requiredHours?: number;

  // Compressed workweek support
  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  workDaysPerWeek?: number;

  @IsNumber()
  @Min(1)
  @Max(24)
  @IsOptional()
  hoursPerDay?: number;
}
