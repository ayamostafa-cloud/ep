import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateJobTemplateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  qualifications: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  skills: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

