import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TimeManagementService } from './time-management.service';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';

@Controller('time-management')
export class TimeManagementController {
  constructor(private readonly tmService: TimeManagementService) {}

  // ------------------- RECORD A PUNCH -------------------
  @Post('punch')
  async recordPunch(@Body() dto: CreatePunchDto) {
    if (!dto.employeeId || !dto.timestamp || !dto.type) {
      throw new BadRequestException('Missing required punch data');
    }
    return this.tmService.recordPunch(dto);
  }

  // ------------------- GET ATTENDANCE -------------------
  @Get('attendance/:employeeId')
  async getAttendance(
    @Param('employeeId') employeeId: string,
    @Query('date') date?: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException('Missing employeeId');
    }
    return this.tmService.getAttendance(employeeId, date);
  }

  // ------------------- GET TIME EXCEPTIONS -------------------
  @Get('exceptions/:employeeId')
  async getExceptions(@Param('employeeId') employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('Missing employeeId');
    }
    return this.tmService.getExceptions(employeeId);
  }

  // ------------------- CREATE TIME EXCEPTION MANUALLY -------------------
  @Post('exceptions')
  async createException(
    @Body()
    body: { employeeId: string; recordId: string; reason: string; assignedToId: string },
  ) {
    if (!body.employeeId || !body.recordId || !body.reason || !body.assignedToId) {
      throw new BadRequestException('Missing required fields');
    }

    return this.tmService.createTimeException(
      body.employeeId,
      body.recordId,
      body.reason,
      body.assignedToId, // pass the required fourth argument
    );
  }

  // ------------------- CORRECT ATTENDANCE -------------------
  @Post('attendance/correct')
  async correctAttendance(
    @Body()
    body: { employeeId: string; date: string; punches: UpdatePunchDto[] },
  ) {
    if (!body.employeeId || !body.date || !body.punches) {
      throw new BadRequestException('Missing required fields');
    }

    const dateObj = new Date(body.date);
    return this.tmService.correctAttendance(
      body.employeeId,
      dateObj,
      body.punches,
    );
  }

  // ------------------- MANUAL MISSED PUNCH DETECTION -------------------
  @Post('attendance/detect-missed')
  async detectMissedPunch(
    @Body() body: { employeeId: string; date: string },
  ) {
    if (!body.employeeId || !body.date) {
      throw new BadRequestException('Missing employeeId/date');
    }

    const dateObj = new Date(body.date);
    return this.tmService.detectMissedPunches(body.employeeId, dateObj);
  }

  @Get('notifications/:employeeId')
  async getNotifications(@Param('employeeId') employeeId: string) {
    return this.tmService.getNotifications(employeeId);
  }

  // ------------------- PHASE 4: EXCEPTION APPROVAL WORKFLOW -------------------
  /**
   * Approve a time exception
   * PATCH /time-management/exceptions/:id/approve
   */
  @Post('exceptions/:id/approve')
  async approveException(
    @Param('id') exceptionId: string,
    @Body() body: { approvedBy: string; notes?: string },
  ) {
    if (!body.approvedBy) {
      throw new BadRequestException('approvedBy is required');
    }
    return this.tmService.approveException(exceptionId, body.approvedBy, body.notes);
  }

  /**
   * Reject a time exception
   * PATCH /time-management/exceptions/:id/reject
   */
  @Post('exceptions/:id/reject')
  async rejectException(
    @Param('id') exceptionId: string,
    @Body() body: { rejectedBy: string; reason?: string },
  ) {
    if (!body.rejectedBy) {
      throw new BadRequestException('rejectedBy is required');
    }
    return this.tmService.rejectException(exceptionId, body.rejectedBy, body.reason);
  }

  /**
   * Get all exceptions (for managers to review)
   * GET /time-management/exceptions
   */
  @Get('exceptions')
  async getAllExceptions(
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.tmService.getAllExceptions(status, assignedTo, employeeId);
  }

  /**
   * Escalate exception if not reviewed
   * POST /time-management/exceptions/:id/escalate
   */
  @Post('exceptions/:id/escalate')
  async escalateException(
    @Param('id') exceptionId: string,
    @Body() body: { escalatedTo: string; reason?: string },
  ) {
    if (!body.escalatedTo) {
      throw new BadRequestException('escalatedTo is required');
    }
    return this.tmService.escalateException(exceptionId, body.escalatedTo, body.reason);
  }
}
