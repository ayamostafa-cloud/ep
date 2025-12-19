import { IsMongoId, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApprovalStatus } from '../enums/approval-status.enum';

export class ApproveOfferDto {
  @IsMongoId()
  employeeId: string;

  @IsString()
  role: string; // e.g., "HR Manager", "Financial Approver"

  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsString()
  @IsOptional()
  comment?: string;
}

