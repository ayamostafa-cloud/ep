export class ShiftExpiryNotificationResponseDto {
  _id: string;
  shiftTemplateId?: string;
  scheduleAssignmentId?: string;
  expiryDate: Date;
  notificationSent: boolean;
  notificationSentAt?: Date;
  notifiedTo: string[];
  status: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
