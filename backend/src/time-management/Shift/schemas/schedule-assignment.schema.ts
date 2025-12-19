import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScheduleAssignmentDocument = ScheduleAssignment & Document;

@Schema({ timestamps: true })
export class ScheduleAssignment {
  @Prop({ type: Types.ObjectId, ref: 'ShiftTemplate', required: true })
  shiftTemplateId: Types.ObjectId; // Reference to the shift template

  // Assignment target - one of these will be set (employee, department, or position)
  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  employeeId?: Types.ObjectId; // Assigned to specific employee

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId; // Assigned to all employees in department

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  positionId?: Types.ObjectId; // Assigned to all employees with this position

  @Prop({ required: true })
  effectiveFrom: Date; // When assignment starts

  @Prop()
  effectiveTo: Date; // When assignment ends (null = indefinite)

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  assignedBy: Types.ObjectId; // Who made the assignment (HR Manager/System Admin)

  @Prop({ default: 'manual', enum: ['manual', 'bulk_assignment', 'automatic'] })
  source: string; // How assignment was created: manual, bulk_assignment, automatic

  @Prop({ type: Object, default: {} })
  metadata: {
    // Additional metadata about the assignment
    notes?: string;
    reason?: string;
    previousAssignmentId?: Types.ObjectId; // If replacing another assignment
  };

  @Prop({
    default: 'Active',
    enum: ['Active', 'Inactive', 'Cancelled', 'Approved', 'Expired'],
  })
  status: string; // Assignment status: Active, Inactive, Cancelled, Approved, Expired
}

export const ScheduleAssignmentSchema =
  SchemaFactory.createForClass(ScheduleAssignment);

// Indexes for efficient querying
ScheduleAssignmentSchema.index({
  employeeId: 1,
  effectiveFrom: 1,
  effectiveTo: 1,
});
ScheduleAssignmentSchema.index({
  departmentId: 1,
  effectiveFrom: 1,
  effectiveTo: 1,
});
ScheduleAssignmentSchema.index({
  positionId: 1,
  effectiveFrom: 1,
  effectiveTo: 1,
});
ScheduleAssignmentSchema.index({ shiftTemplateId: 1 });
ScheduleAssignmentSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
