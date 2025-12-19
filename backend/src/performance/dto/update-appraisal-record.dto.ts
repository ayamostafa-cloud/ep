// src/performance/dto/update-appraisal-record.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAppraisalRecordDto } from './create-appraisal-record.dto';

export class UpdateAppraisalRecordDto extends PartialType(
  CreateAppraisalRecordDto,
) {}
