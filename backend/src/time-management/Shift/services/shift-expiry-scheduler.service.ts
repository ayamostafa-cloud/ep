import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShiftExpiryService } from './shift-expiry.service';

@Injectable()
export class ShiftExpirySchedulerService {
  private readonly logger = new Logger(ShiftExpirySchedulerService.name);

  constructor(private readonly shiftExpiryService: ShiftExpiryService) {}

  /**
   * Scheduled job to detect expiring shifts and create notifications
   * Runs daily at 9:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExpiringShifts(): Promise<void> {
    this.logger.log('Starting scheduled job: Detecting expiring shifts...');

    try {
      const notificationCount =
        await this.shiftExpiryService.detectExpiringShifts(30); // 30 days before expiry

      if (notificationCount > 0) {
        this.logger.log(
          `Created ${notificationCount} new expiry notifications`,
        );
      } else {
        this.logger.log('No new expiring shifts detected');
      }
    } catch (error) {
      this.logger.error(
        `Error detecting expiring shifts: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual trigger for testing (can be called via API endpoint if needed)
   */
  async triggerExpiryDetection(daysBeforeExpiry: number = 30): Promise<number> {
    this.logger.log(
      `Manually triggering expiry detection (${daysBeforeExpiry} days before expiry)`,
    );
    return await this.shiftExpiryService.detectExpiringShifts(daysBeforeExpiry);
  }
}
