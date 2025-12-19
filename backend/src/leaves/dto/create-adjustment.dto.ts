import { IsString, IsNumber, Min, IsEnum } from 'class-validator';

export enum AdjustmentType {
  ADD = 'add',
  DEDUCT = 'deduct',
}

export class CreateAdjustmentDto {
  @IsString()
  employeeId: string;

  @IsString()
  leaveTypeId: string;

  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  reason: string;

  @IsString()
  hrUserId: string;
}
