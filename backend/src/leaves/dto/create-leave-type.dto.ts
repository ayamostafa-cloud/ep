import { IsString, IsBoolean, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  categoryId: string;

  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @IsBoolean()
  @IsOptional()
  deductible?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresAttachment?: boolean;

  @IsString()
  @IsOptional()
  attachmentType?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minTenureMonths?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDurationDays?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
