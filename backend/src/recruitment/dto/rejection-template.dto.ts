import { IsString, IsNotEmpty } from 'class-validator';

export class RejectionTemplateDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

