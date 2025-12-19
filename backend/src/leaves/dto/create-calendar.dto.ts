import { IsNumber, Min, Max, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBlockedPeriodDto } from './create-blocked-period.dto';
import { CreateHolidayDto } from './create-holiday.dto';

export class CreateCalendarDto {
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHolidayDto)
  holidays?: CreateHolidayDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlockedPeriodDto)
  blockedPeriods?: CreateBlockedPeriodDto[];

  @IsArray()
  @IsOptional()
  workingDays?: number[];

  @IsOptional()
  isActive?: boolean;
}
