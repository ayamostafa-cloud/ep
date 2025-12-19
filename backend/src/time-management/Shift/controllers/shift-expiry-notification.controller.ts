import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ShiftExpiryService } from '../services/shift-expiry.service';
import { ShiftExpirySchedulerService } from '../services/shift-expiry-scheduler.service';
import { ShiftExpiryNotificationResponseDto } from '../dto/shift-expiry-notification-response.dto';

@ApiTags('notifications')
@Controller('time-management/notifications')
export class ShiftExpiryNotificationController {
  constructor(
    private readonly shiftExpiryService: ShiftExpiryService,
    private readonly shiftExpirySchedulerService: ShiftExpirySchedulerService,
  ) {}

  /**
   * Get all shift expiry notifications
   * GET /time-management/notifications/shifts
   */
  @Get('shifts')
  @ApiOperation({ summary: 'Get all shift expiry notifications' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by notification status',
    enum: ['pending', 'sent', 'acknowledged', 'resolved'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of expiry notifications',
    type: [ShiftExpiryNotificationResponseDto],
  })
  async getNotifications(@Query('status') status?: string) {
    return await this.shiftExpiryService.getNotifications(status);
  }

  /**
   * Manually trigger expiry detection (for testing)
   * POST /time-management/notifications/shifts/detect
   * This endpoint manually triggers the expiry detection job that normally runs at 9 AM daily
   */
  @Post('shifts/detect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger expiry detection',
    description:
      'Manually trigger the expiry detection job to create notifications for shifts/assignments expiring within the specified days. Normally runs automatically at 9 AM daily.',
  })
  @ApiQuery({
    name: 'daysBeforeExpiry',
    required: false,
    description: 'Number of days before expiry to detect (default: 30)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Expiry detection completed',
    schema: {
      type: 'object',
      properties: {
        notificationsCreated: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async triggerDetection(@Query('daysBeforeExpiry') daysBeforeExpiry?: number) {
    const days = daysBeforeExpiry
      ? parseInt(daysBeforeExpiry.toString(), 10)
      : 30;
    const count =
      await this.shiftExpirySchedulerService.triggerExpiryDetection(days);
    return {
      notificationsCreated: count,
      message: `Expiry detection completed. Created ${count} new notification(s) for shifts/assignments expiring within ${days} days.`,
    };
  }
}
