import { IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateHolidayDto {
  @IsDateString()
  date: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  isRecurring?: boolean;
}
