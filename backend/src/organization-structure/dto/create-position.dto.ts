import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  departmentId: string;

  @IsOptional()
  @IsMongoId()
  reportsToPositionId?: string;
}
