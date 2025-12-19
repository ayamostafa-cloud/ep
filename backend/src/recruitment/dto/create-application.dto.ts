import { IsMongoId, IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

export class CreateApplicationDto {
  @IsMongoId()
  candidateId: string;

  @IsMongoId()
  requisitionId: string;

  @IsMongoId()
  @IsOptional()
  assignedHr?: string;

  @IsEnum(ApplicationStage)
  @IsOptional()
  currentStage?: ApplicationStage;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  // CV/Resume file path (after upload)
  @IsString()
  @IsOptional()
  cvPath?: string;

  // Consent for data processing (BR28)
  @IsBoolean()
  consentGiven: boolean;

  // Referral flag (BR14, BR25)
  @IsBoolean()
  @IsOptional()
  isReferral?: boolean;

  @IsMongoId()
  @IsOptional()
  referredBy?: string;
}

