import { IsEnum } from 'class-validator';
import { OfferResponseStatus } from '../enums/offer-response-status.enum';

export class RespondOfferDto {
  @IsEnum(OfferResponseStatus)
  response: OfferResponseStatus;
}

