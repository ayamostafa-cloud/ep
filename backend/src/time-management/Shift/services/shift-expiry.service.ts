import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ShiftExpiryNotification,
  ShiftExpiryNotificationDocument,
} from '../schemas/shift-expiry-notification.schema';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';

@Injectable()
export class ShiftExpiryService {
  constructor(
    @InjectModel(ShiftExpiryNotification.name)
    private shiftExpiryNotificationModel: Model<ShiftExpiryNotificationDocument>,
    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>,
    @InjectModel(ScheduleAssignment.name)
    private scheduleAssignmentModel: Model<ScheduleAssignmentDocument>,
  ) {}

  /**
   * Get all shift expiry notifications
   */
  async getNotifications(
    status?: string,
  ): Promise<ShiftExpiryNotificationDocument[]> {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    try {
      const notifications = await this.shiftExpiryNotificationModel
        .find(query)
        .sort({ expiryDate: 1 })
        .exec();
      
      // Manually populate if needed (optional - can be removed if causing issues)
      // For now, return without populate to avoid errors
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Detect expiring shifts and create notifications (called by scheduled job)
   */
  async detectExpiringShifts(daysBeforeExpiry: number = 30): Promise<number> {
    const today = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + daysBeforeExpiry);

    let notificationCount = 0;

    // Check expiring shift templates
    const expiringTemplates = await this.shiftTemplateModel
      .find({
        expirationDate: { $lte: expiryThreshold, $gte: today },
        status: 'Active',
      })
      .exec();

    for (const template of expiringTemplates) {
      // Check if notification already exists
      const existingNotification = await this.shiftExpiryNotificationModel
        .findOne({
          shiftTemplateId: template._id,
          status: { $in: ['pending', 'sent'] },
        })
        .exec();

      if (!existingNotification && template.expirationDate) {
        await this.shiftExpiryNotificationModel.create({
          shiftTemplateId: template._id,
          expiryDate: template.expirationDate,
          notificationSent: false,
          status: 'pending',
        });
        notificationCount++;
      }
    }

    // Check expiring schedule assignments
    const expiringAssignments = await this.scheduleAssignmentModel
      .find({
        effectiveTo: { $lte: expiryThreshold, $gte: today },
        status: 'Active',
      })
      .exec();

    for (const assignment of expiringAssignments) {
      // Check if notification already exists
      const existingNotification = await this.shiftExpiryNotificationModel
        .findOne({
          scheduleAssignmentId: assignment._id,
          status: { $in: ['pending', 'sent'] },
        })
        .exec();

      if (!existingNotification && assignment.effectiveTo) {
        await this.shiftExpiryNotificationModel.create({
          scheduleAssignmentId: assignment._id,
          expiryDate: assignment.effectiveTo,
          notificationSent: false,
          status: 'pending',
        });
        notificationCount++;
      }
    }

    return notificationCount;
  }
}
