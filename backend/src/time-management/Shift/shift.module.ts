import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftTemplateService } from './services/shift-template.service';
import { ScheduleAssignmentService } from './services/schedule-assignment.service';
import { ShiftExpiryService } from './services/shift-expiry.service';
import { ShiftExpirySchedulerService } from './services/shift-expiry-scheduler.service';
import { ShiftTemplateController } from './controllers/shift-template.controller';
import { ScheduleAssignmentController } from './controllers/schedule-assignment.controller';
import { ShiftExpiryNotificationController } from './controllers/shift-expiry-notification.controller';
import { ShiftTemplate, ShiftTemplateSchema } from './schemas/shift.schema';
import {
  ScheduleAssignment,
  ScheduleAssignmentSchema,
} from './schemas/schedule-assignment.schema';
import {
  ShiftExpiryNotification,
  ShiftExpiryNotificationSchema,
} from './schemas/shift-expiry-notification.schema';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShiftTemplate.name, schema: ShiftTemplateSchema },
      { name: ScheduleAssignment.name, schema: ScheduleAssignmentSchema },
      {
        name: ShiftExpiryNotification.name,
        schema: ShiftExpiryNotificationSchema,
      },
      // Note: Employee schema should be imported from the main time-management module if needed
    ]),
  ],
  controllers: [
    ShiftTemplateController,
    ScheduleAssignmentController,
    ShiftExpiryNotificationController,
  ],
  providers: [
    ShiftTemplateService,
    ScheduleAssignmentService,
    ShiftExpiryService,
    ShiftExpirySchedulerService,
    RolesGuard,
  ],
  exports: [
    ShiftTemplateService,
    ScheduleAssignmentService,
    ShiftExpiryService,
  ],
})
export class ShiftModule {}
