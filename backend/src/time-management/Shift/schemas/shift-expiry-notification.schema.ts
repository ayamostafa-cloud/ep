import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShiftExpiryNotificationDocument = ShiftExpiryNotification &
  Document;

@Schema({ timestamps: true })
export class ShiftExpiryNotification {
  // Can reference either a shift template or a schedule assignment
  @Prop({ type: Types.ObjectId, ref: 'ShiftTemplate' })
  shiftTemplateId?: Types.ObjectId; // If template is expiring

  @Prop({ type: Types.ObjectId, ref: 'ScheduleAssignment' })
  scheduleAssignmentId?: Types.ObjectId; // If assignment is expiring

  @Prop({ required: true })
  expiryDate: Date; // When the shift/assignment expires

  @Prop({ default: false })
  notificationSent: boolean; // Whether notification email/alert was sent

  @Prop()
  notificationSentAt: Date; // When notification was sent

  @Prop({ type: [Types.ObjectId], ref: 'Employee', default: [] })
  notifiedTo: Types.ObjectId[]; // HR staff/System Admins who were notified

  @Prop({
    default: 'pending',
    enum: ['pending', 'sent', 'acknowledged', 'resolved'],
  })
  status: string; // Notification status

  @Prop()
  resolvedAt: Date; // When the expiring shift was renewed/reassigned

  @Prop()
  resolutionNotes: string; // Notes about how it was resolved (renewed, replaced, etc.)
}

export const ShiftExpiryNotificationSchema = SchemaFactory.createForClass(
  ShiftExpiryNotification,
);

// Indexes for efficient querying
ShiftExpiryNotificationSchema.index({ expiryDate: 1, status: 1 });
ShiftExpiryNotificationSchema.index({ shiftTemplateId: 1 });
ShiftExpiryNotificationSchema.index({ scheduleAssignmentId: 1 });
ShiftExpiryNotificationSchema.index({ notificationSent: 1, status: 1 });
