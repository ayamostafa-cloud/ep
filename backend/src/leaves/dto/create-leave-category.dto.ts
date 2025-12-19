import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateLeaveCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;
}
