import { IsOptional, IsDate, IsMongoId, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '../enums/application-status.enum';

export class AnalyticsQueryDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsMongoId()
  @IsOptional()
  requisitionId?: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}

