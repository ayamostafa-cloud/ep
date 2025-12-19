import { IsString, IsOptional } from 'class-validator';

export class ApproveRequestDto {
  @IsString()
  approverId: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
