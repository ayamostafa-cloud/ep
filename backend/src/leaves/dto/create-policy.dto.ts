import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum AccrualMethod {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
  NONE = 'NONE'
}

export class EligibilityDto {
  @IsNumber()
  @Min(0)
  minTenureMonths: number;

  @IsOptional()
  positionsAllowed?: string[];

  @IsOptional()
  contractTypesAllowed?: string[];
}

export class CreatePolicyDto {
  @IsString()
  leaveTypeId: string;

  @IsString()
  policyType: string;

  @IsEnum(AccrualMethod)
  @IsOptional()
  accrualMethod?: AccrualMethod;

  @IsNumber()
  @IsOptional()
  @Min(0)
  accrualRate?: number;

  @IsBoolean()
  @IsOptional()
  carryForwardAllowed?: boolean;

  @IsNumber()
  @IsOptional()
  maxCarryForward?: number;

  @IsNumber()
  @IsOptional()
  maxPerYear?: number;

  @IsString()
  @IsOptional()
  effectiveFrom?: string;

  @IsString()
  @IsOptional()
  effectiveTo?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => EligibilityDto)
  eligibility?: EligibilityDto;

  @IsOptional()
  approvalChain?: {
    level: number;
    role: string;
  }[];
}
