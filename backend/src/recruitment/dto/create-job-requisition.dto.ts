import { IsString, IsNumber, IsOptional, IsMongoId, IsDate, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJobRequisitionDto {
  @IsString()
  @IsNotEmpty()
  requisitionId: string;

  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @IsNumber()
  @Min(1)
  openings: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsMongoId()
  @IsNotEmpty()
  hiringManagerId: string;

  @IsEnum(['draft', 'published', 'closed'])
  @IsOptional()
  publishStatus?: 'draft' | 'published' | 'closed';

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  postingDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiryDate?: Date;
}

