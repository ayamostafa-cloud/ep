export class UpdateInsuranceBracketDto {
  payload: Record<string, any>;
}

export class ApproveInsuranceBracketDto {
  approverId: string;
}

export class RejectInsuranceBracketDto {
  reviewerId: string;
}

export class CreateConfigurationDto {
  [key: string]: any;
}

export class UpdateConfigurationDto {
  payload: Record<string, any>;
}

