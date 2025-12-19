import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AttendanceRecord,
  AttendanceRecordDocument,
  Punch,
} from './attendance/schemas/attendance-record.schema';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';
import { TimeException, TimeExceptionDocument } from './attendance/schemas/time-exception.schema';
import { TimeExceptionType, TimeExceptionStatus, PunchType } from './enums/index';
import { NotificationLog, NotificationLogDocument } from './notifications/schemas/notification-log.schema';
import { PolicyEngineService } from './policy/services/policy-engine.service';


@Injectable()
export class TimeManagementService {
  constructor(
    @InjectModel(AttendanceRecord.name)
    private readonly attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name)
    private readonly exceptionModel: Model<TimeExceptionDocument>,
    @InjectModel(NotificationLog.name)
    private readonly notificationModel: Model<NotificationLogDocument>,
    private readonly policyEngineService: PolicyEngineService,
  ) {}

  // ------------------- RECORD A PUNCH -------------------
  async recordPunch(dto: CreatePunchDto) {
    const employeeObjectId = new Types.ObjectId(dto.employeeId);
    const punchTime = new Date(dto.timestamp);

    // Prepare day boundaries
    const startOfDay = new Date(punchTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(punchTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Find today's attendance
    let attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': { $gte: startOfDay, $lte: endOfDay },
    });

    // Create new if none found
    if (!attendance) {
      attendance = new this.attendanceModel({
        employeeId: employeeObjectId,
        recordDate: startOfDay, // Required field - set to start of day
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    // Add punch
    attendance.punches.push({
      type: dto.type,
      time: punchTime,
    });

    // Calculate totalWorkMinutes from punches
    attendance.totalWorkMinutes = this.calculateWorkedMinutes(attendance.punches);
    
    // Check for missed punches (should have at least one IN and one OUT)
    const hasInPunch = attendance.punches.some(p => p.type === 'IN');
    const hasOutPunch = attendance.punches.some(p => p.type === 'OUT');
    attendance.hasMissedPunch = !hasInPunch || !hasOutPunch;

    // Save updated record
    const savedRecord = await attendance.save();

    // ------------------- AUTO MISSED PUNCH CHECK -------------------
    const punchesToday = savedRecord.punches.length;

    if (punchesToday < 2) {
  const existing = await this.exceptionModel.findOne({
    employeeId: employeeObjectId,
    type: 'MISSED_PUNCH',
    'createdAt': { $gte: startOfDay, $lte: endOfDay }
  });

  if (!existing) {
    // Note: assignedTo is required but we don't have manager ID here
    // Using employee's own ID as fallback - should be updated by manager later
    const exception = await this.exceptionModel.create({
      employeeId: employeeObjectId,
      attendanceRecordId: savedRecord._id,
      type: 'MISSED_PUNCH',
      status: 'OPEN',
      assignedTo: employeeObjectId, // Required field - using employee ID as fallback
      reason: `Employee has only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`,
    });

    // Send notification
    await this.sendNotification(
      dto.employeeId,
      'MISSED_PUNCH',
      `Missed punch detected: only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`
    );
  }
}

    return {
      message: 'Punch recorded successfully',
      attendance: savedRecord,
    };
  }
    async getNotifications(employeeId: string) {
  return this.notificationModel.find({ to: new Types.ObjectId(employeeId) }).lean();
}

    async sendNotification(
      to: string, 
      type: string, 
      message?: string
       ){
        const notification = new this.notificationModel({
        to: new Types.ObjectId(to),
        type,
        message,
  });
  return notification.save();
}

  // ------------------- GET ATTENDANCE -------------------
  async getAttendance(employeeId: string, date?: string) {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      query['punches.time'] = { $gte: start, $lte: end };
    }

    const record = await this.attendanceModel.findOne(query);
    if (!record)
      return { message: 'No attendance found', punches: [] };

    // Recalculate if totalWorkMinutes is 0 but we have punches (for old data)
    if (record.totalWorkMinutes === 0 && record.punches.length >= 2) {
      // Ensure punch times are Date objects
      const punchesWithDates = record.punches.map(p => ({
        type: p.type,
        time: p.time instanceof Date ? p.time : new Date(p.time),
      }));
      record.totalWorkMinutes = this.calculateWorkedMinutes(punchesWithDates);
      
      // Update missed punch flag
      const hasInPunch = punchesWithDates.some(p => p.type === 'IN');
      const hasOutPunch = punchesWithDates.some(p => p.type === 'OUT');
      record.hasMissedPunch = !hasInPunch || !hasOutPunch;
      
      // Save the recalculated values
      await record.save();
    }

    return {
      _id: record._id,
      employeeId: record.employeeId,
      recordDate: record.recordDate,
      punches: record.punches,
      totalWorkMinutes: record.totalWorkMinutes,
      hasMissedPunch: record.hasMissedPunch,
      exceptionIds: record.exceptionIds,
      finalisedForPayroll: record.finalisedForPayroll,
    };
  }

  // ------------------- CREATE TIME EXCEPTION -------------------
  async createTimeException(
    employeeId: string,
    recordId: string,
    reason: string,
    assignedToId: string,
  ) {
    const exception = new this.exceptionModel({
      employeeId: new Types.ObjectId(employeeId),
      attendanceRecordId: new Types.ObjectId(recordId),
      reason,
      type: TimeExceptionType.MISSED_PUNCH,
      status: TimeExceptionStatus.OPEN,
      assignedTo: new Types.ObjectId(assignedToId), // required field
    });
    return exception.save();
  }

  // ------------------- GET TIME EXCEPTIONS -------------------
  async getExceptions(employeeId: string) {
    return this.exceptionModel.find({
      employeeId: new Types.ObjectId(employeeId),
    }).exec();
  }

  // ------------------- CORRECT ATTENDANCE -------------------
  async correctAttendance(
    employeeId: string,
    date: Date,
    punches: UpdatePunchDto[],
  ) {
    const employeeObjectId = new Types.ObjectId(employeeId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': { $gte: startOfDay, $lte: endOfDay },
    });

    if (!attendance) {
      attendance = new this.attendanceModel({
        employeeId: employeeObjectId,
        recordDate: startOfDay, // Required field - set to start of day
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    // Ensure timestamp is converted to Date
    attendance.punches = punches.map((p) => ({
      type: p.type,
      time: p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp),
    }));

    // Calculate totalWorkMinutes from punches
    attendance.totalWorkMinutes = this.calculateWorkedMinutes(attendance.punches);
    
    // Check for missed punches (should have at least one IN and one OUT)
    const hasInPunch = attendance.punches.some(p => p.type === 'IN');
    const hasOutPunch = attendance.punches.some(p => p.type === 'OUT');
    attendance.hasMissedPunch = !hasInPunch || !hasOutPunch;

    const saved = await attendance.save();
    return {
      message: 'Attendance corrected successfully',
      attendance: saved,
    };
  }

  // ------------------- MANUAL MISSED PUNCH DETECTION -------------------
  async detectMissedPunches(employeeId: string, date: Date) {
    const employeeObjectId = new Types.ObjectId(employeeId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const punchesCount = attendance?.punches.length || 0;
    if (punchesCount < 2) {
      // Note: assignedTo is required but we don't have manager ID here
      // Using employee's own ID as fallback - should be updated by manager later
      const exception = new this.exceptionModel({
        employeeId: employeeObjectId,
        type: TimeExceptionType.MISSED_PUNCH,
        attendanceRecordId: attendance?._id,
        assignedTo: employeeObjectId, // Required field - using employee ID as fallback
        status: TimeExceptionStatus.OPEN,
        reason: `Missed punches on ${date.toDateString()}`,
      });
      await exception.save();
      return { message: 'Time exception created', exception };
    }
    return { message: 'No missed punches detected' };
  }

  /**
   * Approve a time exception
   */
  async approveException(
    exceptionId: string,
    approvedBy: string,
    notes?: string,
  ) {
    const exception = await this.exceptionModel.findById(exceptionId);
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    if (exception.status === TimeExceptionStatus.APPROVED) {
      throw new BadRequestException('Exception is already approved');
    }

    if (exception.status === TimeExceptionStatus.REJECTED) {
      throw new BadRequestException('Cannot approve a rejected exception');
    }

    exception.status = TimeExceptionStatus.APPROVED;
    exception.assignedTo = new Types.ObjectId(approvedBy);
    if (notes) {
      exception.reason = notes;
    }
    await exception.save();

    // Trigger policy recalculation if attendance record exists
    if (exception.attendanceRecordId) {
      try {
        const attendance = await this.attendanceModel.findById(exception.attendanceRecordId);
        if (attendance) {
          // Use recordDate if available, otherwise use first punch time, otherwise use current date
          const recordDate = attendance.recordDate || 
                            (attendance.punches && attendance.punches.length > 0 ? attendance.punches[0].time : new Date());
          
          // Ensure attendanceRecordId is an ObjectId
          const attendanceRecordId = exception.attendanceRecordId instanceof Types.ObjectId 
            ? exception.attendanceRecordId 
            : new Types.ObjectId(exception.attendanceRecordId);
          
          const result = await this.policyEngineService.recalculatePolicyResults(
            attendanceRecordId,
            recordDate instanceof Date ? recordDate : new Date(recordDate),
            undefined,
            undefined,
            undefined,
          );
          await this.policyEngineService.saveComputedResults(result);
        }
      } catch (error) {
        // Log error but don't fail the approval
        console.error('Error recalculating policy results after exception approval:', error);
      }
    }

    // Send notification (don't fail if notification fails)
    try {
      const employeeIdStr = exception.employeeId instanceof Types.ObjectId 
        ? exception.employeeId.toString() 
        : String(exception.employeeId);
      await this.sendNotification(
        employeeIdStr,
        'EXCEPTION_APPROVED',
        `Your time exception has been approved`,
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return {
      message: 'Exception approved successfully',
      exception,
    };
  }

  /**
   * Reject a time exception
   */
  async rejectException(
    exceptionId: string,
    rejectedBy: string,
    reason?: string,
  ) {
    const exception = await this.exceptionModel.findById(exceptionId);
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    if (exception.status === TimeExceptionStatus.REJECTED) {
      throw new BadRequestException('Exception is already rejected');
    }

    if (exception.status === TimeExceptionStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an approved exception');
    }

    exception.status = TimeExceptionStatus.REJECTED;
    exception.assignedTo = new Types.ObjectId(rejectedBy);
    if (reason) {
      exception.reason = reason;
    }
    await exception.save();

    // Send notification
    try {
      const employeeIdStr = exception.employeeId instanceof Types.ObjectId 
        ? exception.employeeId.toString() 
        : String(exception.employeeId);
      await this.sendNotification(
        employeeIdStr,
        'EXCEPTION_REJECTED',
        `Your time exception has been rejected${reason ? ': ' + reason : ''}`,
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return {
      message: 'Exception rejected successfully',
      exception,
    };
  }

  /**
   * Get all exceptions with filters (for managers)
   */
  async getAllExceptions(
    status?: string,
    assignedTo?: string,
    employeeId?: string,
  ) {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (assignedTo) {
      query.assignedTo = new Types.ObjectId(assignedTo);
    }
    if (employeeId) {
      query.employeeId = new Types.ObjectId(employeeId);
    }

    return this.exceptionModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Escalate exception if not reviewed
   */
  async escalateException(
    exceptionId: string,
    escalatedTo: string,
    reason?: string,
  ) {
    const exception = await this.exceptionModel.findById(exceptionId);
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    if (exception.status === TimeExceptionStatus.APPROVED || exception.status === TimeExceptionStatus.REJECTED) {
      throw new BadRequestException('Cannot escalate a resolved exception');
    }

    exception.status = TimeExceptionStatus.ESCALATED;
    exception.assignedTo = new Types.ObjectId(escalatedTo);
    if (reason) {
      exception.reason = (exception.reason || '') + ` [Escalated: ${reason}]`;
    }
    await exception.save();

    // Send notification
    try {
      const employeeIdStr = exception.employeeId instanceof Types.ObjectId 
        ? exception.employeeId.toString() 
        : String(exception.employeeId);
      await this.sendNotification(
        employeeIdStr,
        'EXCEPTION_ESCALATED',
        `Your time exception has been escalated for review`,
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return {
      message: 'Exception escalated successfully',
      exception,
    };
  }

  /**
   * Calculate worked minutes from punches
   * Matches IN/OUT pairs and sums the time differences
   */
  private calculateWorkedMinutes(punches: Array<{ type: string; time: Date }>): number {
    if (punches.length === 0) return 0;

    // Sort punches by time
    const sortedPunches = [...punches].sort((a, b) => a.time.getTime() - b.time.getTime());
    let totalMinutes = 0;
    let lastInTime: Date | null = null;

    for (const punch of sortedPunches) {
      // Handle both enum and string types (case-insensitive)
      const punchType = punch.type.toString().toUpperCase();
      if (punchType === 'IN') {
        lastInTime = punch.time;
      } else if (punchType === 'OUT' && lastInTime) {
        const diffMs = punch.time.getTime() - lastInTime.getTime();
        const minutes = Math.floor(diffMs / (1000 * 60));
        if (minutes > 0) {
          totalMinutes += minutes;
        }
        lastInTime = null; // Reset after pairing
      }
    }

    return totalMinutes;
  }
}
