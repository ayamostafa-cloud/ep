import { IsString, IsDate, IsOptional, IsIn, isEnum, IsEnum } from 'class-validator'
import { PunchType } from '../../enums';

export class CreatePunchDto {
  @IsString()
  employeeId: string;

  @IsDate()
  timestamp: Date;

  @IsEnum(PunchType)
  type: PunchType;

  @IsOptional()
  @IsString()
  device?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  rawMetadata?: Record<string, any>;
}
