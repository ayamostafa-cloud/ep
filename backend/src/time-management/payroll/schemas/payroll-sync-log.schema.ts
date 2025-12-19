import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";

export enum PayrollSyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export type PayrollSyncLogDocument = HydratedDocument<PayrollSyncLog>;

@Schema({ timestamps: true })
export class PayrollSyncLog {
  @Prop({ required: true })
  periodStart: Date; // Payroll period start date

  @Prop({ required: true })
  periodEnd: Date; // Payroll period end date

  @Prop({ enum: PayrollSyncStatus, default: PayrollSyncStatus.PENDING })
  status: PayrollSyncStatus;

  @Prop({ type: Object })
  payloadSummary: {
    totalRecords: number;
    totalEmployees: number;
    totalOvertimeMinutes: number;
    totalPenalties: number;
    totalAmount: number;
  };

  @Prop({ type: [Object] })
  errors?: Array<{
    employeeId: string;
    recordId: string;
    error: string;
    timestamp: Date;
  }>;

  @Prop({ type: Types.ObjectId,  required: false })
  initiatedBy?: Types.ObjectId;

  @Prop({ type: Date })
  syncedAt?: Date;

  @Prop()
  externalSyncId?: string; // ID from external payroll system

  @Prop({ type: Object })
  rawPayload?: Record<string, any>; // Full payload for audit

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  lastError?: string;
}

export const PayrollSyncLogSchema = SchemaFactory.createForClass(PayrollSyncLog);

