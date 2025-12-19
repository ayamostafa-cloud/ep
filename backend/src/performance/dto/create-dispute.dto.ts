// src/performance/dto/create-dispute.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}
