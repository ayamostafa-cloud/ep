// src/performance/dto/update-appraisal-status.dto.ts
import { IsEnum } from 'class-validator';
import { AppraisalRecordStatus } from '../enums/performance.enums';

export class UpdateAppraisalStatusDto {
  @IsEnum(AppraisalRecordStatus)
  status: AppraisalRecordStatus;
}
