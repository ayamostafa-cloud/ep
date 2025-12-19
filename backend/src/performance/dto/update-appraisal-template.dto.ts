import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateAppraisalTemplateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  sections?: string[]; // or replace with actual section type

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
