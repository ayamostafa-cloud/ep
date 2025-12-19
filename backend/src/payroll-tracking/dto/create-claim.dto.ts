import { IsString, IsMongoId, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClaimDto {
  @IsString()
  claimId: string; // e.g. CLAIM-0001 (frontend can generate for now)

  @IsString()
  description: string;

  @IsString()
  claimType: string; // e.g. "medical", "overtime", etc.

  @IsMongoId()
  employeeId: string;

  @IsOptional()
  @IsMongoId()
  financeStaffId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}
