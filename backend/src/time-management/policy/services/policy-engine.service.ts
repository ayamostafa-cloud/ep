import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { TimeException, TimeExceptionDocument } from '../../attendance/schemas/time-exception.schema';
import { TimePolicy, TimePolicyDocument, RoundingRule, PolicyScope } from '../schemas/time-policy.schema';
import { PenaltyRecord, PenaltyRecordDocument, PenaltyType, PenaltyStatus } from '../schemas/penalty-record.schema';
import { OvertimeRecord, OvertimeRecordDocument, OvertimeStatus } from '../schemas/overtime-record.schema';
import { TimeExceptionStatus, TimeExceptionType } from '../../enums/index';

export interface ComputedResult {
  workedMinutes: number;
  overtimeMinutes: number;
  latenessMinutes: number;
  shortTimeMinutes: number;
  penalties: PenaltyRecordDocument[];
  overtime: OvertimeRecordDocument[];
  appliedPolicy: TimePolicy;
}

@Injectable()
export class PolicyEngineService {
  constructor(
    @InjectModel(TimePolicy.name) private policyModel: Model<TimePolicyDocument>,
    @InjectModel(AttendanceRecord.name) private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name) private exceptionModel: Model<TimeExceptionDocument>,
    @InjectModel(PenaltyRecord.name) private penaltyModel: Model<PenaltyRecordDocument>,
    @InjectModel(OvertimeRecord.name) private overtimeModel: Model<OvertimeRecordDocument>,
  ) {}

  /**
   * Get applicable policy for an employee on a given date
   */
  async getApplicablePolicy(employeeId: Types.ObjectId, date: Date): Promise<TimePolicyDocument | null> {
    // Priority: Employee-specific > Department > Global
    const employeePolicy = await this.policyModel.findOne({
      scope: PolicyScope.EMPLOYEE,
      employeeId,
      active: true,
      $or: [
        { effectiveFrom: { $lte: date }, effectiveTo: { $gte: date } },
        { effectiveFrom: { $lte: date }, effectiveTo: null },
        { effectiveFrom: null, effectiveTo: { $gte: date } },
        { effectiveFrom: null, effectiveTo: null },
      ],
    }).sort({ createdAt: -1 });

    if (employeePolicy) return employeePolicy;

    // TODO: Get department from employee profile
    // For now, check global policies
    const globalPolicy = await this.policyModel.findOne({
      scope: PolicyScope.GLOBAL,
      active: true,
      $or: [
        { effectiveFrom: { $lte: date }, effectiveTo: { $gte: date } },
        { effectiveFrom: { $lte: date }, effectiveTo: null },
        { effectiveFrom: null, effectiveTo: { $gte: date } },
        { effectiveFrom: null, effectiveTo: null },
      ],
    }).sort({ createdAt: -1 });

    return globalPolicy;
  }

  /**
   * Compute policy results for an attendance record
   */
  async computePolicyResults(
    attendanceRecord: AttendanceRecordDocument,
    recordDate: Date,
    scheduledStartTime?: Date,
    scheduledEndTime?: Date,
    scheduledMinutes?: number,
  ): Promise<ComputedResult> {
    const policy = await this.getApplicablePolicy(attendanceRecord.employeeId, recordDate);
    
    if (!policy) {
      throw new Error(`No applicable policy found for employee ${attendanceRecord.employeeId} on ${recordDate}`);
    }

    // Get approved exceptions for this record
    const approvedExceptions = await this.exceptionModel.find({
      attendanceRecordId: attendanceRecord._id,
      status: TimeExceptionStatus.APPROVED,
    });

    // Calculate worked minutes from punches
    let workedMinutes = this.calculateWorkedMinutes(attendanceRecord.punches);
    
    // Apply rounding
    workedMinutes = this.applyRounding(workedMinutes, policy.roundingRule, policy.roundingIntervalMinutes);

    // Calculate lateness
    let latenessMinutes = 0;
    if (scheduledStartTime) {
      // Validate that scheduledStartTime is on the same date as recordDate
      const scheduledDate = new Date(scheduledStartTime);
      const recordDateOnly = new Date(recordDate);
      recordDateOnly.setHours(0, 0, 0, 0);
      scheduledDate.setHours(0, 0, 0, 0);
      
      // Only calculate lateness if scheduled time is on the same date as record
      if (scheduledDate.getTime() === recordDateOnly.getTime()) {
        latenessMinutes = this.calculateLateness(attendanceRecord.punches, scheduledStartTime, policy.latenessRule);
      } else {
        // If dates don't match, don't calculate lateness (likely data error)
        console.warn(`Scheduled start time date (${scheduledDate.toISOString()}) doesn't match record date (${recordDateOnly.toISOString()}). Skipping lateness calculation.`);
      }
    }

    // Calculate short-time
    const shortTimeMinutes = scheduledMinutes
      ? Math.max(0, scheduledMinutes - workedMinutes)
      : 0;

    // Calculate overtime
    const overtimeMinutes = scheduledMinutes
      ? Math.max(0, workedMinutes - scheduledMinutes)
      : 0;

    // Check if it's a weekend
    const isWeekend = this.isWeekend(recordDate, policy.weekendRule);

    // Apply exceptions
    const exceptionAdjustments = this.applyExceptions(approvedExceptions, {
      workedMinutes,
      overtimeMinutes,
      latenessMinutes,
      shortTimeMinutes,
    });

    // Compute penalties
    const penalties = await this.computePenalties(
      attendanceRecord,
      policy,
      latenessMinutes,
      shortTimeMinutes,
      exceptionAdjustments,
      recordDate,
    );

    // Compute overtime records
    const overtimeRecords = await this.computeOvertime(
      attendanceRecord,
      policy,
      overtimeMinutes,
      workedMinutes,
      scheduledMinutes || 0,
      isWeekend,
      exceptionAdjustments,
      recordDate,
    );

    return {
      workedMinutes: exceptionAdjustments.workedMinutes,
      overtimeMinutes: exceptionAdjustments.overtimeMinutes,
      latenessMinutes: exceptionAdjustments.latenessMinutes,
      shortTimeMinutes: exceptionAdjustments.shortTimeMinutes,
      penalties,
      overtime: overtimeRecords,
      appliedPolicy: policy,
    };
  }

  /**
   * Calculate worked minutes from punches
   */
  private calculateWorkedMinutes(punches: Array<{ type: string; time: Date }>): number {
    if (punches.length === 0) return 0;

    const sortedPunches = [...punches].sort((a, b) => a.time.getTime() - b.time.getTime());
    let totalMinutes = 0;
    let lastInTime: Date | null = null;

    for (const punch of sortedPunches) {
      if (punch.type === 'IN') {
        lastInTime = punch.time;
      } else if (punch.type === 'OUT' && lastInTime) {
        const diffMs = punch.time.getTime() - lastInTime.getTime();
        totalMinutes += Math.floor(diffMs / (1000 * 60));
        lastInTime = null;
      }
    }

    return totalMinutes;
  }

  /**
   * Apply rounding rules
   */
  private applyRounding(minutes: number, rule: RoundingRule, interval: number): number {
    if (rule === RoundingRule.NONE || interval === 0) return minutes;

    switch (rule) {
      case RoundingRule.ROUND_UP:
        return Math.ceil(minutes / interval) * interval;
      case RoundingRule.ROUND_DOWN:
        return Math.floor(minutes / interval) * interval;
      case RoundingRule.ROUND_NEAREST:
        return Math.round(minutes / interval) * interval;
      default:
        return minutes;
    }
  }

  /**
   * Calculate lateness in minutes
   */
  private calculateLateness(
    punches: Array<{ type: string; time: Date }>,
    scheduledStart: Date,
    latenessRule?: any,
  ): number {
    const firstInPunch = punches.find(p => p.type === 'IN');
    if (!firstInPunch) return 0;

    const gracePeriod = latenessRule?.gracePeriodMinutes || 0;
    
    // Ensure both dates are Date objects
    const punchTime = firstInPunch.time instanceof Date ? firstInPunch.time : new Date(firstInPunch.time);
    const scheduledTime = scheduledStart instanceof Date ? scheduledStart : new Date(scheduledStart);
    
    // Calculate difference in minutes
    const timeDiffMinutes = (punchTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
    const lateBy = Math.max(0, timeDiffMinutes - gracePeriod);
    
    return Math.floor(lateBy);
  }

  /**
   * Check if date is a weekend based on policy
   */
  private isWeekend(date: Date, weekendRule?: any): boolean {
    if (!weekendRule?.enabled) return false;
    const dayOfWeek = date.getDay();
    return weekendRule.weekendDays?.includes(dayOfWeek) || false;
  }

  /**
   * Apply approved exceptions to computed values
   */
  private applyExceptions(
    exceptions: TimeExceptionDocument[],
    baseValues: {
      workedMinutes: number;
      overtimeMinutes: number;
      latenessMinutes: number;
      shortTimeMinutes: number;
    },
  ): {
    workedMinutes: number;
    overtimeMinutes: number;
    latenessMinutes: number;
    shortTimeMinutes: number;
  } {
    let adjusted = { ...baseValues };

    for (const exception of exceptions) {
      switch (exception.type) {
        case TimeExceptionType.MANUAL_ADJUSTMENT:
          // Manual adjustments would have specific values stored
          // For now, we'll handle this in the exception record itself
          break;
        case TimeExceptionType.LATE:
          // Approved late exception removes lateness penalty
          adjusted.latenessMinutes = 0;
          break;
        case TimeExceptionType.OVERTIME_REQUEST:
          // Approved overtime request may add overtime
          // This would need to be stored in the exception record
          break;
        case TimeExceptionType.SHORT_TIME:
          // Approved short-time exception removes short-time penalty
          adjusted.shortTimeMinutes = 0;
          break;
      }
    }

    return adjusted;
  }

  /**
   * Compute penalties based on policy
   */
  private async computePenalties(
    attendanceRecord: AttendanceRecordDocument,
    policy: TimePolicyDocument,
    latenessMinutes: number,
    shortTimeMinutes: number,
    exceptionAdjustments: any,
    recordDate: Date,
  ): Promise<PenaltyRecordDocument[]> {
    const penalties: PenaltyRecordDocument[] = [];

    // Lateness penalty
    if (policy.latenessRule && exceptionAdjustments.latenessMinutes > 0) {
      const latenessRule = policy.latenessRule;
      const penaltyMinutes = exceptionAdjustments.latenessMinutes;
      let amount = penaltyMinutes * (latenessRule.deductionPerMinute || 0);

      // Apply max deduction cap
      if (latenessRule.maxDeductionPerDay && amount > latenessRule.maxDeductionPerDay) {
        amount = latenessRule.maxDeductionPerDay;
      }

      // Apply policy penalty cap
      if (policy.penaltyCapPerDay && amount > policy.penaltyCapPerDay) {
        amount = policy.penaltyCapPerDay;
      }

      if (amount > 0) {
        const penalty = new this.penaltyModel({
          employeeId: attendanceRecord.employeeId,
          attendanceRecordId: attendanceRecord._id,
          policyId: policy._id,
          type: PenaltyType.LATENESS,
          amount,
          minutes: penaltyMinutes,
          status: PenaltyStatus.PENDING,
          recordDate,
        });
        penalties.push(penalty);
      }
    }

    // Short-time penalty
    if (policy.shortTimeRule && exceptionAdjustments.shortTimeMinutes > 0) {
      const shortTimeRule = policy.shortTimeRule;
      const penaltyMinutes = exceptionAdjustments.shortTimeMinutes;
      
      // Check if grace period applies
      const gracePeriod = shortTimeRule.gracePeriodMinutes || 0;
      const effectiveShortMinutes = Math.max(0, penaltyMinutes - gracePeriod);
      
      if (effectiveShortMinutes > 0) {
        let amount = effectiveShortMinutes * (shortTimeRule.penaltyPerMinute || 0);

        // Apply policy penalty cap
        if (policy.penaltyCapPerDay && amount > policy.penaltyCapPerDay) {
          amount = policy.penaltyCapPerDay;
        }

        if (amount > 0) {
          const penalty = new this.penaltyModel({
            employeeId: attendanceRecord.employeeId,
            attendanceRecordId: attendanceRecord._id,
            policyId: policy._id,
            type: PenaltyType.SHORT_TIME,
            amount,
            minutes: effectiveShortMinutes,
            status: PenaltyStatus.PENDING,
            recordDate,
          });
          penalties.push(penalty);
        }
      }
    }

    // Missed punch penalty (if applicable)
    if (attendanceRecord.hasMissedPunch) {
      const penalty = new this.penaltyModel({
        employeeId: attendanceRecord.employeeId,
        attendanceRecordId: attendanceRecord._id,
        policyId: policy._id,
        type: PenaltyType.MISSED_PUNCH,
        amount: 0, // Could be configured in policy
        minutes: 0,
        status: PenaltyStatus.PENDING,
        recordDate,
      });
      penalties.push(penalty);
    }

    return penalties;
  }

  /**
   * Compute overtime records
   */
  private async computeOvertime(
    attendanceRecord: AttendanceRecordDocument,
    policy: TimePolicyDocument,
    overtimeMinutes: number,
    workedMinutes: number,
    scheduledMinutes: number,
    isWeekend: boolean,
    exceptionAdjustments: any,
    recordDate: Date,
  ): Promise<OvertimeRecordDocument[]> {
    const overtimeRecords: OvertimeRecordDocument[] = [];

    if (!policy.overtimeRule || exceptionAdjustments.overtimeMinutes <= 0) {
      return overtimeRecords;
    }

    const overtimeRule = policy.overtimeRule;
    const effectiveOvertime = exceptionAdjustments.overtimeMinutes;

    // Check threshold
    if (effectiveOvertime < overtimeRule.thresholdMinutes) {
      return overtimeRecords;
    }

    // Apply daily cap if set
    let cappedOvertime = effectiveOvertime;
    if (overtimeRule.dailyCapMinutes && cappedOvertime > overtimeRule.dailyCapMinutes) {
      cappedOvertime = overtimeRule.dailyCapMinutes;
    }

    // Determine multiplier (weekend vs regular)
    const multiplier = isWeekend && overtimeRule.weekendMultiplier
      ? overtimeRule.weekendMultiplier
      : overtimeRule.multiplier;

    // Calculate amount (assuming base rate is 1.0 per minute)
    const regularMinutes = scheduledMinutes;
    const calculatedAmount = cappedOvertime * multiplier;

    const overtimeRecord = new this.overtimeModel({
      employeeId: attendanceRecord.employeeId,
      attendanceRecordId: attendanceRecord._id,
      policyId: policy._id,
      overtimeMinutes: cappedOvertime,
      regularMinutes,
      multiplier,
      calculatedAmount,
      status: OvertimeStatus.PENDING,
      recordDate,
      isWeekend,
    });

    overtimeRecords.push(overtimeRecord);

    return overtimeRecords;
  }

  /**
   * Recalculate policy results for an attendance record (after exception approval)
   */
  async recalculatePolicyResults(
    attendanceRecordId: Types.ObjectId,
    recordDate: Date,
    scheduledStartTime?: Date,
    scheduledEndTime?: Date,
    scheduledMinutes?: number,
  ): Promise<ComputedResult> {
    const attendanceRecord = await this.attendanceModel.findById(attendanceRecordId);
    if (!attendanceRecord) {
      throw new Error(`Attendance record ${attendanceRecordId} not found`);
    }

    // Delete existing pending/computed records
    await this.penaltyModel.deleteMany({
      attendanceRecordId,
      status: { $in: [PenaltyStatus.PENDING] },
    });
    await this.overtimeModel.deleteMany({
      attendanceRecordId,
      status: { $in: [OvertimeStatus.PENDING] },
    });

    // Recompute
    return this.computePolicyResults(
      attendanceRecord,
      recordDate,
      scheduledStartTime,
      scheduledEndTime,
      scheduledMinutes,
    );
  }

  /**
   * Save computed results to database
   */
  async saveComputedResults(result: ComputedResult): Promise<void> {
    // Save penalties
    for (const penalty of result.penalties) {
      await penalty.save();
    }

    // Save overtime records
    for (const overtime of result.overtime) {
      await overtime.save();
    }
  }
}

