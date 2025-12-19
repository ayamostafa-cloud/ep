import { IsMongoId, IsNotEmpty } from 'class-validator';

export class SetReportingLineDto {
  @IsMongoId()
  @IsNotEmpty()
  reportsToPositionId: string;
}
