import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";

/**
 * Policy Scope - determines who the policy applies to
 * - GLOBAL: Applies to all employees
 * - DEPARTMENT: Applies to a specific department
 * - EMPLOYEE: Applies to a specific employee (highest priority)
 */
export enum PolicyScope {
  GLOBAL = 'GLOBAL',
  DEPARTMENT = 'DEPARTMENT',
  EMPLOYEE = 'EMPLOYEE',
}

/**
 * Rounding Rule - how to round calculated work minutes
 * - NONE: No rounding
 * - ROUND_UP: Always round up (e.g., 487 min → 495 min with 15-min interval)
 * - ROUND_DOWN: Always round down (e.g., 487 min → 480 min)
 * - ROUND_NEAREST: Round to nearest (e.g., 487 min → 480 min, 492 min → 495 min)
 */
export enum RoundingRule {
  NONE = 'NONE',
  ROUND_UP = 'ROUND_UP',
  ROUND_DOWN = 'ROUND_DOWN',
  ROUND_NEAREST = 'ROUND_NEAREST',
}

/**
 * Overtime Rule Configuration
 * Embedded in TimePolicy (not a separate collection)
 * Contains calculation parameters for overtime computation
 * 
 * Note: This is different from the OvertimeRule schema in schedule/
 * which is a standalone document. This config is embedded in policies.
 */
export type OvertimeRuleConfig = {
  thresholdMinutes: number; // Minutes after which overtime starts (e.g., 480 = 8 hours)
  multiplier: number; // Overtime rate multiplier (e.g., 1.5x, 2x)
  dailyCapMinutes?: number; // Maximum overtime counted per day (optional)
  weeklyCapMinutes?: number; // Maximum overtime counted per week (optional)
  weekendMultiplier?: number; // Different multiplier for weekend work (optional)
};

/**
 * Lateness Rule Configuration
 * Embedded in TimePolicy for lateness penalty calculation
 * 
 * Note: This extends the basic LatenessRule schema with additional fields
 * needed for policy computation (caps, cumulative thresholds)
 */
export type LatenessRuleConfig = {
  gracePeriodMinutes: number; // Grace period before penalty applies
  deductionPerMinute: number; // Penalty amount per minute late
  cumulativeThresholdMinutes?: number; // Total lateness before additional penalty
  maxDeductionPerDay?: number; // Maximum deduction per day (cap)
};

/**
 * Short-Time Rule Configuration
 * For penalizing employees who work less than scheduled hours
 */
export type ShortTimeRuleConfig = {
  minimumWorkMinutes: number; // Minimum required work minutes
  penaltyPerMinute?: number; // Penalty for each minute short
  gracePeriodMinutes?: number; // Grace period before penalty applies
};

/**
 * Weekend Rule Configuration
 * Special rules for weekend work (different rates, etc.)
 */
export type WeekendRuleConfig = {
  enabled: boolean; // Whether weekend rules apply
  weekendDays: number[]; // Day numbers (0 = Sunday, 6 = Saturday)
  specialRate?: number; // Special rate for weekend work
};

export type TimePolicyDocument = HydratedDocument<TimePolicy>;

@Schema({ timestamps: true })
export class TimePolicy {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ enum: PolicyScope, required: true, default: PolicyScope.GLOBAL })
  scope: PolicyScope;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: false })
  departmentId?: Types.ObjectId; // Required if scope is DEPARTMENT

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: false })
  employeeId?: Types.ObjectId; // Required if scope is EMPLOYEE

  // Lateness rules
  @Prop({ type: Object, required: false })
  latenessRule?: LatenessRuleConfig;

  // Overtime rules
  @Prop({ type: Object, required: false })
  overtimeRule?: OvertimeRuleConfig;

  // Short-time rules
  @Prop({ type: Object, required: false })
  shortTimeRule?: ShortTimeRuleConfig;

  // Weekend rules
  @Prop({ type: Object, required: false })
  weekendRule?: WeekendRuleConfig;

  // Rounding rules
  @Prop({ enum: RoundingRule, default: RoundingRule.NONE })
  roundingRule: RoundingRule;

  @Prop({ default: 15 })
  roundingIntervalMinutes: number; // Round to nearest 15 minutes, etc.

  // Penalty formulas
  @Prop({ default: 0 })
  penaltyCapPerDay?: number; // Maximum penalty per day

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Date })
  effectiveFrom?: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;
}

export const TimePolicySchema = SchemaFactory.createForClass(TimePolicy);

