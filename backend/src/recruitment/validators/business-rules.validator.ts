import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validator for BR2: Job requisition must include required fields
 */
@ValidatorConstraint({ async: false })
export class IsValidJobRequisitionConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    
    // BR2: Validate required fields
    if (!object.requisitionId || !object.openings || !object.hiringManagerId) {
      return false;
    }
    
    // BR2: Openings must be at least 1
    if (object.openings < 1) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Job requisition must include requisitionId, openings (≥1), and hiringManagerId (BR2)';
  }
}

export function IsValidJobRequisition(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidJobRequisitionConstraint,
    });
  };
}

/**
 * Validator for BR28: Consent must be given for data processing
 */
@ValidatorConstraint({ async: false })
export class HasConsentConstraint implements ValidatorConstraintInterface {
  validate(value: boolean, args: ValidationArguments) {
    // BR28: Storing talent pool needs applicant authorization
    return value === true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Candidate consent is required for data processing and storage (BR28)';
  }
}

export function HasConsent(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasConsentConstraint,
    });
  };
}

/**
 * Validator for BR19: Interview panel must have members
 */
@ValidatorConstraint({ async: false })
export class HasInterviewPanelConstraint implements ValidatorConstraintInterface {
  validate(value: any[], args: ValidationArguments) {
    // BR19: At least one panel member required
    return Array.isArray(value) && value.length > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'At least one interview panel member is required (BR19)';
  }
}

export function HasInterviewPanel(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasInterviewPanelConstraint,
    });
  };
}

/**
 * Validator for BR10, BR21, BR22: Assessment scores must be within valid range
 */
@ValidatorConstraint({ async: false })
export class IsValidAssessmentScoreConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    // BR21: Scores must be within pre-set range (1-10)
    return typeof value === 'number' && value >= 1 && value <= 10;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Assessment score must be between 1 and 10 (BR21)';
  }
}

export function IsValidAssessmentScore(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAssessmentScoreConstraint,
    });
  };
}

/**
 * Validator for BR26: Offer must include required compensation fields
 */
@ValidatorConstraint({ async: false })
export class IsValidOfferConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    
    // BR26: Offer must include salary, role, and content
    if (!object.grossSalary || !object.role || !object.content) {
      return false;
    }
    
    // BR26: Salary must be positive
    if (object.grossSalary <= 0) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Offer must include positive grossSalary, role, and content (BR26)';
  }
}

export function IsValidOffer(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidOfferConstraint,
    });
  };
}

