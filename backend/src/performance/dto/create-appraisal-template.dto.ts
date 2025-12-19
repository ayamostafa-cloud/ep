// src/performance/dto/create-appraisal-template.dto.ts
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AppraisalTemplateType,
  AppraisalRatingScaleType,
} from '../enums/performance.enums';

export class CreateAppraisalTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AppraisalTemplateType)
  type: AppraisalTemplateType;

  @IsOptional()
  @IsArray()
  applicableDepartmentIds?: string[];

  @IsOptional()
  @IsArray()
  applicablePositionIds?: string[];

  @IsEnum(AppraisalRatingScaleType)
  ratingScaleType: AppraisalRatingScaleType;

  @IsOptional()
  @IsArray()
  ratingScaleDefinition?: {
    label: string;
    minScore?: number;
    maxScore?: number;
    description?: string;
  }[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria: CriterionDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/* ============================= */

class CriterionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  weight: number;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}