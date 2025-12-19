import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PenaltyRecord, PenaltyRecordDocument, PenaltyStatus } from '../../policy/schemas/penalty-record.schema';
import { OvertimeRecord, OvertimeRecordDocument, OvertimeStatus } from '../../policy/schemas/overtime-record.schema';
import { TimeException, TimeExceptionDocument } from '../../attendance/schemas/time-exception.schema';
import { TimeExceptionStatus } from '../../enums/index';
import { PayrollService } from './payroll.service';

@Injectable()
export class PrePayrollService {
  constructor(
    @InjectModel(PenaltyRecord.name) private penaltyModel: Model<PenaltyRecordDocument>,
    @InjectModel(OvertimeRecord.name) private overtimeModel: Model<OvertimeRecordDocument>,
    @InjectModel(TimeException.name) private exceptionModel: Model<TimeExceptionDocument>,
    private payrollService: PayrollService,
  ) {}

  /**
   * Run pre-payroll closure job
   * Validates, produces report, and escalates if needed
   */
  async runPrePayrollClosure(
    periodStart: Date,
    periodEnd: Date,
    escalationDeadlineHours = 24,
  ): Promise<{
    validationResult: any;
    report: any;
    escalations: any[];
  }> {
    // Validate pre-payroll requirements
    const validationResult = await this.payrollService.validatePrePayroll(periodStart, periodEnd);

    // Generate pre-sync validation report
    const report = await this.generatePreSyncReport(periodStart, periodEnd);

    // Check for escalations
    const escalations = await this.checkAndEscalate(
      periodStart,
      periodEnd,
      escalationDeadlineHours,
    );

    return {
      validationResult,
      report,
      escalations,
    };
  }

  /**
   * Generate pre-sync validation report
   */
  private async generatePreSyncReport(periodStart: Date, periodEnd: Date) {
    const pendingOvertime = await this.overtimeModel.find({
      recordDate: { $gte: periodStart, $lte: periodEnd },
      status: OvertimeStatus.PENDING,
    }).populate('employeeId', 'name email').exec();

    const pendingPenalties = await this.penaltyModel.find({
      recordDate: { $gte: periodStart, $lte: periodEnd },
      status: PenaltyStatus.PENDING,
    }).populate('employeeId', 'name email').exec();

    const pendingExceptions = await this.exceptionModel.find({
      createdAt: { $gte: periodStart, $lte: periodEnd },
      status: { $in: [TimeExceptionStatus.OPEN, TimeExceptionStatus.PENDING] },
    }).populate('employeeId', 'name email').exec();

    return {
      periodStart,
      periodEnd,
      generatedAt: new Date(),
      pendingOvertime: {
        count: pendingOvertime.length,
        records: pendingOvertime.map(ot => ({
          id: ot._id,
          employee: (ot.employeeId as any)?.name || 'Unknown',
          minutes: ot.overtimeMinutes,
          amount: ot.calculatedAmount,
        })),
      },
      pendingPenalties: {
        count: pendingPenalties.length,
        records: pendingPenalties.map(p => ({
          id: p._id,
          employee: (p.employeeId as any)?.name || 'Unknown',
          type: p.type,
          amount: p.amount,
        })),
      },
      pendingExceptions: {
        count: pendingExceptions.length,
        records: pendingExceptions.map(e => ({
          id: e._id,
          employee: (e.employeeId as any)?.name || 'Unknown',
          type: e.type,
          status: e.status,
        })),
      },
    };
  }

  /**
   * Check for items that need escalation and escalate them
   */
  private async checkAndEscalate(
    periodStart: Date,
    periodEnd: Date,
    deadlineHours: number,
  ): Promise<Array<{ type: string; recordId: string; escalated: boolean; reason: string }>> {
    const escalations: Array<{ type: string; recordId: string; escalated: boolean; reason: string }> = [];
    const deadline = new Date();
    deadline.setHours(deadline.getHours() - deadlineHours);

    // Check overtime records
    const oldPendingOvertime = await this.overtimeModel.find({
      recordDate: { $gte: periodStart, $lte: periodEnd },
      status: OvertimeStatus.PENDING,
      createdAt: { $lt: deadline },
    }).exec();

    for (const ot of oldPendingOvertime) {
      // TODO: Implement actual escalation logic (notify manager, update status, etc.)
      escalations.push({
        type: 'OVERTIME',
        recordId: ot._id.toString(),
        escalated: true,
        reason: `Overtime record pending for more than ${deadlineHours} hours`,
      });
    }

    // Check penalty records
    const oldPendingPenalties = await this.penaltyModel.find({
      recordDate: { $gte: periodStart, $lte: periodEnd },
      status: PenaltyStatus.PENDING,
      createdAt: { $lt: deadline },
    }).exec();

    for (const penalty of oldPendingPenalties) {
      escalations.push({
        type: 'PENALTY',
        recordId: penalty._id.toString(),
        escalated: true,
        reason: `Penalty record pending for more than ${deadlineHours} hours`,
      });
    }

    // Check exceptions
    const oldPendingExceptions = await this.exceptionModel.find({
      createdAt: { 
        $gte: periodStart, 
        $lte: periodEnd,
        $lt: deadline 
      },
      status: { $in: [TimeExceptionStatus.OPEN, TimeExceptionStatus.PENDING] },
    }).exec();

    for (const exception of oldPendingExceptions) {
      escalations.push({
        type: 'EXCEPTION',
        recordId: exception._id.toString(),
        escalated: true,
        reason: `Exception pending for more than ${deadlineHours} hours`,
      });
    }

    return escalations;
  }
}

