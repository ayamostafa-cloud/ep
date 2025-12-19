import { IsMongoId, IsString, IsOptional } from 'class-validator';

export class CreateReferralDto {
  @IsMongoId()
  referringEmployeeId: string;

  @IsMongoId()
  candidateId: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  level?: string;
}

