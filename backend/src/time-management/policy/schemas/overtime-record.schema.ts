import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";

export enum OvertimeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  OVERRIDDEN = 'OVERRIDDEN',
}

export type OvertimeRecordDocument = HydratedDocument<OvertimeRecord>;

@Schema({ timestamps: true })
export class OvertimeRecord {
  @Prop({ type: Types.ObjectId,  required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Attendance', required: true })
  attendanceRecordId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TimePolicy', required: true })
  policyId: Types.ObjectId;

  @Prop({ required: true })
  overtimeMinutes: number; // Total overtime minutes

  @Prop({ required: true })
  regularMinutes: number; // Regular work minutes

  @Prop({ required: true })
  multiplier: number; // Applied multiplier (1.5x, 2x, etc.)

  @Prop({ required: true })
  calculatedAmount: number; // Calculated overtime amount

  @Prop({ enum: OvertimeStatus, default: OvertimeStatus.PENDING })
  status: OvertimeStatus;

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

  @Prop({ type: Date, required: true , default: Date.now })
  recordDate: Date; // Date of the attendance record

  @Prop({ default: false })
  isWeekend: boolean; // Whether this is weekend overtime
}

export const OvertimeRecordSchema = SchemaFactory.createForClass(OvertimeRecord);

