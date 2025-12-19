import { IsString } from 'class-validator';

export class CancelRequestDto {
  @IsString()
  requestedBy: string;
}
