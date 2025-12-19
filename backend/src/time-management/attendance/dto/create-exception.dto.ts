import { IsString, IsOptional, IsArray, IsDate } from 'class-validator';

export class CreateExceptionDto {
  @IsString()
  employeeId: string;

  @IsString()
  exceptionType: string; // e.g., 'MISSED_IN', 'MISSED_OUT', 'LATE', 'EARLY_LEAVE'

  @IsString()
  submitter: string;

  @IsOptional()
  @IsArray()
  approverChain?: string[]; // e.g., ['manager1', 'hr1']

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsDate()
  deadline?: Date;
}
