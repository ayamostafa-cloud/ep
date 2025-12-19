import { IsString, IsOptional } from 'class-validator';

export class ApproveManagerDto {
  @IsString()
  approverId: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
