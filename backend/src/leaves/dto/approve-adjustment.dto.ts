import { IsString } from 'class-validator';

export class ApproveAdjustmentDto {
  @IsString()
  approverId: string;
}
