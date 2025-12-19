import { IsMongoId, IsNumber, IsArray, IsString, IsOptional, IsDate, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOfferDto {
  @IsMongoId()
  applicationId: string;

  @IsMongoId()
  candidateId: string;

  @IsMongoId()
  @IsOptional()
  hrEmployeeId?: string;

  @IsNumber()
  @Min(0)
  grossSalary: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  signingBonus?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @IsString()
  @IsOptional()
  conditions?: string;

  @IsString()
  @IsOptional()
  insurances?: string;

  @IsString()
  @IsNotEmpty()
  content: string; // Offer letter content

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsDate()
  @Type(() => Date)
  deadline: Date;
}

