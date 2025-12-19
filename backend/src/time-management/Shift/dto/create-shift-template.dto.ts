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

export class CreateShiftTemplateDto {
  @IsString()
  name: string;

  @IsEnum([
    'normal',
    'split',
    'overnight',
    'rotational',
    'flexible',
    'compressed',
  ])
  type: string;

  @ValidateIf((o) =>
    ['normal', 'split', 'overnight', 'rotational'].includes(o.type),
  )
  @IsString()
  startTime?: string; // Format: "HH:mm" (required for non-flexible shifts)

  @ValidateIf((o) =>
    ['normal', 'split', 'overnight', 'rotational'].includes(o.type),
  )
  @IsString()
  endTime?: string; // Format: "HH:mm" (required for non-flexible shifts)

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restDays?: string[]; // e.g., ["Saturday", "Sunday"]

  @IsNumber()
  @Min(0)
  @Max(60)
  @IsOptional()
  gracePeriod?: number; // Minutes

  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @IsString()
  @IsOptional()
  rotationalPattern?: string | null; // e.g., "4-on/3-off"

  @IsDateString()
  @IsOptional()
  expirationDate?: Date | null;

  @IsEnum(['Active', 'Inactive', 'Expired', 'Cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Flexible hours support (required when type is 'flexible')
  @ValidateIf((o) => o.type === 'flexible')
  @IsString()
  flexibleStartWindow?: string; // e.g., "06:00" - earliest time employee can start

  @ValidateIf((o) => o.type === 'flexible')
  @IsString()
  flexibleEndWindow?: string; // e.g., "20:00" - latest time employee can end

  @ValidateIf((o) => o.type === 'flexible')
  @IsNumber()
  @Min(1)
  @Max(24)
  requiredHours?: number; // e.g., 8 - number of hours employee must work within the window

  // Compressed workweek support (required when type is 'compressed')
  @ValidateIf((o) => o.type === 'compressed')
  @IsNumber()
  @Min(1)
  @Max(7)
  workDaysPerWeek?: number; // e.g., 4 - number of working days per week

  @ValidateIf((o) => o.type === 'compressed')
  @IsNumber()
  @Min(1)
  @Max(24)
  hoursPerDay?: number; // e.g., 10 - number of hours per working day
}
