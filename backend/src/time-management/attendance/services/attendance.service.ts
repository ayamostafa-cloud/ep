import { Controller, Get, Post, Param, Query, Body, BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../schemas/attendance-record.schema';
import { TimeException, TimeExceptionDocument } from '../schemas/time-exception.schema';
import { PunchType, TimeExceptionType, TimeExceptionStatus } from '../../enums/index';
import { CreatePunchDto } from '../dto/create-punch.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(AttendanceRecord.name) private recordModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name) private exceptionModel: Model<TimeExceptionDocument>,
  ) {}

  /** Create a punch (IN/OUT) for an employee */
  async createPunch(dto: CreatePunchDto) {
    // Ensure timestamp is a Date object
    const punchTime = dto.timestamp instanceof Date ? dto.timestamp : new Date(dto.timestamp);
    
    // Normalize date to start of day
    const dateOnly = new Date(punchTime);
    dateOnly.setHours(0, 0, 0, 0);

    // Find or create today's attendance record
    let record = await this.recordModel.findOne<AttendanceRecordDocument>({
      employeeId: new Types.ObjectId(dto.employeeId),
      recordDate: dateOnly,
      finalisedForPayroll: true, // optional: only modify current active record
    });

    if (!record) {
      record = new this.recordModel({
        employeeId: new Types.ObjectId(dto.employeeId),
        recordDate: dateOnly,
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    // Process the punch
    if (dto.type === PunchType.IN) {
      record.punches.push({ type: PunchType.IN, time: punchTime });
    } else if (dto.type === PunchType.OUT) {
      // Find last IN punch before this OUT
      const lastInPunch = record.punches
        .filter(p => p.type === PunchType.IN)
        .slice(-1)[0];

      const lastOutPunch = record.punches
        .filter(p => p.type === PunchType.OUT)
        .slice(-1)[0];

      // Check if there's a valid IN punch before this OUT
      if (lastInPunch && (!lastOutPunch || lastOutPunch.time < lastInPunch.time)) {
        // Valid OUT punch - has matching IN punch
        record.punches.push({ type: PunchType.OUT, time: punchTime });
      } else {
        // No matching IN punch → create TimeException
        // Note: Using employee's own ID as fallback for assignedTo (required field)
        // Should be updated by manager later
        const exception = await this.exceptionModel.create({
          employeeId: new Types.ObjectId(dto.employeeId),
          type: TimeExceptionType.MISSED_PUNCH,
          attendanceRecordId: record._id,
          assignedTo: new Types.ObjectId(dto.employeeId), // Required field - using employee ID as fallback
          status: TimeExceptionStatus.OPEN,
          reason: 'Out punch without corresponding IN punch',
        });
        // Link exception to attendance record
        record.exceptionIds.push(exception._id);
        // Still add the OUT punch
        record.punches.push({ type: PunchType.OUT, time: punchTime });
      }
    }

    // Calculate totalWorkMinutes from punches
    record.totalWorkMinutes = this.calculateWorkedMinutes(record.punches);
    
    // Check for missed punches (should have at least one IN and one OUT)
    const hasInPunch = record.punches.some(p => p.type === PunchType.IN);
    const hasOutPunch = record.punches.some(p => p.type === PunchType.OUT);
    record.hasMissedPunch = !hasInPunch || !hasOutPunch;

    // Save the attendance record
    await record.save();

    return record;
  }

  /** Get attendance record for a specific employee and date */
   async getAttendance(employeeId: string, date?: Date): Promise<AttendanceRecordDocument | null> {
    const query: FilterQuery<AttendanceRecordDocument> = { 
      employeeId: new Types.ObjectId(employeeId) 
    };

    if (date) {
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      query.recordDate = dateOnly;
    }

    const record = await this.recordModel.findOne(query).exec();
    
    // Recalculate if totalWorkMinutes is 0 but we have punches (for old data)
    if (record && record.totalWorkMinutes === 0 && record.punches.length >= 2) {
      // Ensure punch times are Date objects
      const punchesWithDates = record.punches.map(p => ({
        type: p.type,
        time: p.time instanceof Date ? p.time : new Date(p.time),
      }));
      record.totalWorkMinutes = this.calculateWorkedMinutes(punchesWithDates);
      
      // Update missed punch flag
      const hasInPunch = punchesWithDates.some(p => p.type === PunchType.IN);
      const hasOutPunch = punchesWithDates.some(p => p.type === PunchType.OUT);
      record.hasMissedPunch = !hasInPunch || !hasOutPunch;
      
      // Save the recalculated values
      await record.save();
    }
    
    return record;
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
      // Handle both enum and string types
      const punchType = punch.type.toString().toUpperCase();
      if (punchType === 'IN' || punchType === PunchType.IN) {
        lastInTime = punch.time;
      } else if ((punchType === 'OUT' || punchType === PunchType.OUT) && lastInTime) {
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
