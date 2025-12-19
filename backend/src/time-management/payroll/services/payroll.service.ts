import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PayrollSyncLog, PayrollSyncLogDocument, PayrollSyncStatus } from '../schemas/payroll-sync-log.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { PenaltyRecord, PenaltyRecordDocument, PenaltyStatus } from '../../policy/schemas/penalty-record.schema';
import { OvertimeRecord, OvertimeRecordDocument, OvertimeStatus } from '../../policy/schemas/overtime-record.schema';
import { TimeException, TimeExceptionDocument } from '../../attendance/schemas/time-exception.schema';
import { TimeExceptionStatus } from '../../enums/index';

export interface PayrollPayload {
  periodStart: string;
  periodEnd: string;
  records: Array<{
    employeeId: string;
    attendanceRecords: Array<{
      recordId: string;
      date: string;
      workedMinutes: number;
      overtime: Array<{
        minutes: number;
        multiplier: number;
        amount: number;
        isWeekend: boolean;
      }>;
      penalties: Array<{
        type: string;
        amount: number;
        minutes: number;
      }>;
    }>;
    totals: {
      totalWorkedMinutes: number;
      totalOvertimeMinutes: number;
      totalOvertimeAmount: number;
      totalPenalties: number;
    };
  }>;
  summary: {
    totalEmployees: number;
    totalRecords: number;
    totalOvertimeMinutes: number;
    totalPenalties: number;
    totalAmount: number;
  };
}

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(PayrollSyncLog.name) private syncLogModel: Model<PayrollSyncLogDocument>,
    @InjectModel(AttendanceRecord.name) private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(PenaltyRecord.name) private penaltyModel: Model<PenaltyRecordDocument>,
    @InjectModel(OvertimeRecord.name) private overtimeModel: Model<OvertimeRecordDocument>,
    @InjectModel(TimeException.name) private exceptionModel: Model<TimeExceptionDocument>,
  ) {}

  /**
   * Generate payroll payload for a given period
   */
  async generatePayrollPayload(
    periodStart: Date,
    periodEnd: Date,
    employeeIds?: Types.ObjectId[],
  ): Promise<PayrollPayload> {
    // Find all validated and finalized attendance records in the period
    const attendanceQuery: any = {
      finalisedForPayroll: true,
      recordDate: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    };

    if (employeeIds && employeeIds.length > 0) {
      attendanceQuery.employeeId = { $in: employeeIds };
    }

    const attendanceRecords = await this.attendanceModel.find(attendanceQuery).exec();

    // Group by employee
    const employeeMap = new Map<string, any>();

    for (const record of attendanceRecords) {
      const empId = record.employeeId.toString();
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employeeId: empId,
          attendanceRecords: [],
          totals: {
            totalWorkedMinutes: 0,
            totalOvertimeMinutes: 0,
            totalOvertimeAmount: 0,
            totalPenalties: 0,
          },
        });
      }

      const employeeData = employeeMap.get(empId);

      // Get approved overtime records
      const overtimeRecords = await this.overtimeModel.find({
        attendanceRecordId: record._id,
        status: OvertimeStatus.APPROVED,
      }).exec();

      // Get approved penalty records
      const penaltyRecords = await this.penaltyModel.find({
        attendanceRecordId: record._id,
        status: PenaltyStatus.APPROVED,
      }).exec();

      const overtime = overtimeRecords.map(ot => ({
        minutes: ot.overtimeMinutes,
        multiplier: ot.multiplier,
        amount: ot.calculatedAmount,
        isWeekend: ot.isWeekend,
      }));

      const penalties = penaltyRecords.map(p => ({
        type: p.type,
        amount: p.amount,
        minutes: p.minutes,
      }));

      const totalOvertimeMinutes = overtimeRecords.reduce((sum, ot) => sum + ot.overtimeMinutes, 0);
      const totalOvertimeAmount = overtimeRecords.reduce((sum, ot) => sum + ot.calculatedAmount, 0);
      const totalPenalties = penaltyRecords.reduce((sum, p) => sum + p.amount, 0);

      employeeData.attendanceRecords.push({
        recordId: record._id.toString(),
        date: record.recordDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        workedMinutes: record.totalWorkMinutes,
        overtime,
        penalties,
      });

      employeeData.totals.totalWorkedMinutes += record.totalWorkMinutes;
      employeeData.totals.totalOvertimeMinutes += totalOvertimeMinutes;
      employeeData.totals.totalOvertimeAmount += totalOvertimeAmount;
      employeeData.totals.totalPenalties += totalPenalties;
    }

    const records = Array.from(employeeMap.values());

    // Calculate summary
    const summary = {
      totalEmployees: records.length,
      totalRecords: attendanceRecords.length,
      totalOvertimeMinutes: records.reduce((sum, r) => sum + r.totals.totalOvertimeMinutes, 0),
      totalPenalties: records.reduce((sum, r) => sum + r.totals.totalPenalties, 0),
      totalAmount: records.reduce((sum, r) => sum + r.totals.totalOvertimeAmount - r.totals.totalPenalties, 0),
    };

    return {
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      records,
      summary,
    };
  }

  /**
   * Sync payroll data to external system
   */
  async syncPayroll(
    periodStart: Date,
    periodEnd: Date,
    initiatedBy?: Types.ObjectId,
    employeeIds?: Types.ObjectId[],
  ): Promise<PayrollSyncLogDocument> {
    // Validate period
    if (periodStart >= periodEnd) {
      throw new BadRequestException('Period start must be before period end');
    }

    // Generate payload
    const payload = await this.generatePayrollPayload(periodStart, periodEnd, employeeIds);

    // Create sync log
    const syncLog = new this.syncLogModel({
      periodStart,
      periodEnd,
      status: PayrollSyncStatus.IN_PROGRESS,
      payloadSummary: {
        totalRecords: payload.summary.totalRecords,
        totalEmployees: payload.summary.totalEmployees,
        totalOvertimeMinutes: payload.summary.totalOvertimeMinutes,
        totalPenalties: payload.summary.totalPenalties,
        totalAmount: payload.summary.totalAmount,
      },
      rawPayload: payload,
      initiatedBy,
      retryCount: 0,
    });

    await syncLog.save();

    try {
      // TODO: Implement actual external payroll system integration
      // For now, we'll simulate the sync
      // In production, this would make an HTTP call to the payroll system
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate success (in production, check actual response)
      syncLog.status = PayrollSyncStatus.COMPLETED;
      syncLog.syncedAt = new Date();
      syncLog.externalSyncId = `SYNC-${Date.now()}`;

      await syncLog.save();
    } catch (error) {
      syncLog.status = PayrollSyncStatus.FAILED;
      syncLog.lastError = error instanceof Error ? error.message : 'Unknown error';
      (syncLog as any).errors = [{
        employeeId: 'SYSTEM',
        recordId: 'SYSTEM',
        error: syncLog.lastError || 'Unknown error',
        timestamp: new Date(),
      }];
      await syncLog.save();
      throw error;
    }

    return syncLog;
  }

  /**
   * Retry failed payroll sync
   */
  async retryPayrollSync(syncLogId: Types.ObjectId): Promise<PayrollSyncLogDocument> {
    const syncLog = await this.syncLogModel.findById(syncLogId);
    if (!syncLog) {
      throw new NotFoundException(`Payroll sync log ${syncLogId} not found`);
    }

    if (syncLog.status === PayrollSyncStatus.COMPLETED) {
      throw new BadRequestException('Sync is already completed');
    }

    syncLog.status = PayrollSyncStatus.IN_PROGRESS;
    syncLog.retryCount += 1;
    await syncLog.save();

    try {
      // Regenerate payload
      const payload = await this.generatePayrollPayload(
        syncLog.periodStart,
        syncLog.periodEnd,
      );

      // TODO: Implement actual retry logic
      await new Promise(resolve => setTimeout(resolve, 100));

      syncLog.status = PayrollSyncStatus.COMPLETED;
      syncLog.syncedAt = new Date();
      syncLog.externalSyncId = `SYNC-${Date.now()}`;
      syncLog.lastError = undefined;

      await syncLog.save();
    } catch (error) {
      syncLog.status = PayrollSyncStatus.FAILED;
      syncLog.lastError = error instanceof Error ? error.message : 'Unknown error';
      await syncLog.save();
      throw error;
    }

    return syncLog;
  }

  /**
   * Get sync status
   */
  async getSyncStatus(syncLogId: Types.ObjectId): Promise<PayrollSyncLogDocument> {
    const syncLog = await this.syncLogModel.findById(syncLogId);
    if (!syncLog) {
      throw new NotFoundException(`Payroll sync log ${syncLogId} not found`);
    }
    return syncLog;
  }

  /**
   * Validate pre-payroll requirements
   */
  async validatePrePayroll(periodStart: Date, periodEnd: Date): Promise<{
    isValid: boolean;
    issues: string[];
    pendingApprovals: number;
    inconsistentRecords: number;
  }> {
    const issues: string[] = [];
    let pendingApprovals = 0;
    let inconsistentRecords = 0;

    // Check for pending overtime approvals
    const pendingOvertime = await this.overtimeModel.countDocuments({
      recordDate: { $gte: periodStart, $lte: periodEnd },
      status: OvertimeStatus.PENDING,
    });
    if (pendingOvertime > 0) {
      issues.push(`${pendingOvertime} pending overtime approvals`);
      pendingApprovals += pendingOvertime;
    }

    // Check for pending penalty approvals
    const pendingPenalties = await this.penaltyModel.countDocuments({
      recordDate: { $gte: periodStart, $lte: periodEnd },
      status: PenaltyStatus.PENDING,
    });
    if (pendingPenalties > 0) {
      issues.push(`${pendingPenalties} pending penalty approvals`);
      pendingApprovals += pendingPenalties;
    }

    // Check for pending exceptions
    const attendanceRecords = await this.attendanceModel.find({
      recordDate: { $gte: periodStart, $lte: periodEnd },
    }).exec();

    for (const record of attendanceRecords) {
      const exceptions = await this.exceptionModel.find({
        attendanceRecordId: record._id,
        status: { $in: [TimeExceptionStatus.OPEN, TimeExceptionStatus.PENDING] },
      });
      if (exceptions.length > 0) {
        issues.push(`Record ${record._id} has ${exceptions.length} unresolved exceptions`);
        inconsistentRecords += exceptions.length;
      }

      // Check if record is not finalized
      if (!record.finalisedForPayroll) {
        issues.push(`Record ${record._id} is not finalized for payroll`);
        inconsistentRecords += 1;
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      pendingApprovals,
      inconsistentRecords,
    };
  }
}

