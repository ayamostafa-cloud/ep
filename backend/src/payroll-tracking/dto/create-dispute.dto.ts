import { IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  disputeId: string;

  @IsString()
  description: string;

  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  payslipId: string;

  @IsOptional()
  @IsMongoId()
  financeStaffId?: string;
}
