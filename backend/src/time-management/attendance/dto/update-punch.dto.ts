import { IsString, IsDate, IsIn, IsOptional } from 'class-validator';
import { PunchType } from '../../enums';

export class UpdatePunchDto {
  @IsDate()
  timestamp: Date;

  @IsIn([PunchType.IN, PunchType.OUT])
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
