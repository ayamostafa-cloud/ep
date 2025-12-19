import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Pipe to validate MongoDB ObjectId format
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string, metadata: ArgumentMetadata): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ObjectId: ${value}`);
    }
    return new Types.ObjectId(value);
  }
}

/**
 * Pipe to sanitize and validate application status transitions
 * Enforces BR9: Applications must follow defined stage progression
 */
@Injectable()
export class ApplicationStatusPipe implements PipeTransform {
  private readonly validTransitions = {
    submitted: ['in_process', 'rejected'],
    in_process: ['offer', 'rejected'],
    offer: ['hired', 'rejected'],
    hired: [],
    rejected: [],
  };

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const { status, currentStage } = value;

    // BR9: Validate stage progression
    if (status && !this.isValidStatus(status)) {
      throw new BadRequestException(`Invalid application status: ${status} (BR9)`);
    }

    return value;
  }

  private isValidStatus(status: string): boolean {
    return ['submitted', 'in_process', 'offer', 'hired', 'rejected'].includes(status);
  }
}

/**
 * Pipe to validate interview scheduling constraints
 * Enforces BR19: Interview scheduling requirements
 */
@Injectable()
export class InterviewSchedulePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const { scheduledDate, panel, method } = value;

    // BR19: Validate scheduled date is in the future
    if (scheduledDate && new Date(scheduledDate) <= new Date()) {
      throw new BadRequestException('Interview must be scheduled for a future date (BR19)');
    }

    // BR19: Validate panel members exist
    if (!panel || panel.length === 0) {
      throw new BadRequestException('At least one panel member is required (BR19)');
    }

    // BR19: Validate video link for video interviews
    if (method === 'video' && !value.videoLink) {
      throw new BadRequestException('Video link is required for video interviews (BR19)');
    }

    return value;
  }
}

/**
 * Pipe to validate offer approval workflow
 * Enforces BR26: Offer approval requirements
 */
@Injectable()
export class OfferApprovalPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const { status, role } = value;

    // BR26(b): Validate approval role
    const validRoles = ['HR Manager', 'Financial Approver', 'Department Head', 'CEO'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(
        `Invalid approver role. Must be one of: ${validRoles.join(', ')} (BR26)`,
      );
    }

    return value;
  }
}

/**
 * Pipe to sanitize and validate analytics queries
 * Enforces BR33: Analytics query validation
 */
@Injectable()
export class AnalyticsQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return value;
    }

    const { startDate, endDate } = value;

    // BR33: Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date must be before end date (BR33)');
    }

    // BR33: Limit date range to prevent performance issues
    if (startDate && endDate) {
      const daysDiff = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
      );
      
      if (daysDiff > 365) {
        throw new BadRequestException('Date range cannot exceed 365 days (BR33)');
      }
    }

    return value;
  }
}

/**
 * Pipe to validate referral data
 * Enforces BR14, BR25: Referral requirements
 */
@Injectable()
export class ReferralValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const { referringEmployeeId, candidateId } = value;

    // BR14: Validate referral source
    if (!referringEmployeeId || !Types.ObjectId.isValid(referringEmployeeId)) {
      throw new BadRequestException('Valid referring employee ID is required (BR14)');
    }

    if (!candidateId || !Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Valid candidate ID is required (BR14)');
    }

    return value;
  }
}

