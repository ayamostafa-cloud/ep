import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";

export enum PenaltyType {
  LATENESS = 'LATENESS',
  SHORT_TIME = 'SHORT_TIME',
  MISSED_PUNCH = 'MISSED_PUNCH',
  EARLY_LEAVE = 'EARLY_LEAVE',
  OTHER = 'OTHER',
}

export enum PenaltyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  OVERRIDDEN = 'OVERRIDDEN',
}

export type PenaltyRecordDocument = HydratedDocument<PenaltyRecord>;

@Schema({ timestamps: true })
export class PenaltyRecord {
  @Prop({ type: Types.ObjectId,  required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Attendance', required: true })
  attendanceRecordId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TimePolicy', required: true })
  policyId: Types.ObjectId;

  @Prop({ enum: PenaltyType, required: true })
  type: PenaltyType;

  @Prop({ required: true })
  amount: number; // Penalty amount (currency or points)

  @Prop({ required: true })
  minutes: number; // Minutes that triggered the penalty

  @Prop({ enum: PenaltyStatus, default: PenaltyStatus.PENDING })
  status: PenaltyStatus;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: false })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop()
  reason?: string;

  @Prop()
  overrideReason?: string; // If manually overridden

  @Prop({ type: Object })
  beforeValues?: Record<string, any>; // Audit: values before exception

  @Prop({ type: Object })
  afterValues?: Record<string, any>; // Audit: values after exception

  @Prop({ type: Types.ObjectId, ref: 'TimeException', required: false })
  exceptionId?: Types.ObjectId; // Linked exception if applicable

  @Prop({ type: Date, required: true ,default: Date.now})
  recordDate: Date; // Date of the attendance record
}

export const PenaltyRecordSchema = SchemaFactory.createForClass(PenaltyRecord);

