import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
  import { RefundStatus } from '../enums/payroll-tracking-enum';

  export class UpdateRefundStatusDto {
    @IsEnum(RefundStatus)
    status: RefundStatus;

    @IsOptional()
    @IsMongoId()
    paidInPayrollRunId?: string;
  }