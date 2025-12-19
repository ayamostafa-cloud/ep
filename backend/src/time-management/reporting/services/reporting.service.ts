import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { PenaltyRecord, PenaltyRecordDocument } from '../../policy/schemas/penalty-record.schema';
import { OvertimeRecord, OvertimeRecordDocument } from '../../policy/schemas/overtime-record.schema';
import { PenaltyStatus } from '../../policy/schemas/penalty-record.schema';
import { OvertimeStatus } from '../../policy/schemas/overtime-record.schema';

export interface AttendanceReportFilters {
  employeeId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  includeExceptions?: boolean;
}

export interface OvertimeReportFilters {
  employeeId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  status?: OvertimeStatus;
}

export interface PenaltyReportFilters {
  employeeId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  type?: string;
  status?: PenaltyStatus;
}

@Injectable()
export class ReportingService {
  constructor(
    @InjectModel(AttendanceRecord.name) private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(PenaltyRecord.name) private penaltyModel: Model<PenaltyRecordDocument>,
    @InjectModel(OvertimeRecord.name) private overtimeModel: Model<OvertimeRecordDocument>,
  ) {}

  async getAttendanceReport(filters: AttendanceReportFilters, page = 1, limit = 50) {
    const query: any = {};

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.startDate || filters.endDate) {
      query.recordDate = {};
      if (filters.startDate) {
        query.recordDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.recordDate.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;
    const queryBuilder = this.attendanceModel.find(query);
    
    // Note: employeeId populate removed because EmployeeProfile schema doesn't exist
    // The employeeId will be returned as ObjectId only
    // If you need employee details, you'll need to register EmployeeProfile schema first
    
    // Only populate exceptionIds if requested
    if (filters.includeExceptions) {
      queryBuilder.populate({
        path: 'exceptionIds',
        strictPopulate: false,
      });
    }
    
    const [records, total] = await Promise.all([
      queryBuilder
        .skip(skip)
        .limit(limit)
        .sort({ recordDate: -1 })
        .exec(),
      this.attendanceModel.countDocuments(query),
    ]);

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOvertimeReport(filters: OvertimeReportFilters, page = 1, limit = 50) {
    const query: any = {};

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.recordDate = {};
      if (filters.startDate) {
        query.recordDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.recordDate.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.overtimeModel
        .find(query)
        .populate('policyId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ recordDate: -1 })
        .exec(),
      this.overtimeModel.countDocuments(query),
    ]);

    // Calculate aggregates
    const aggregates = await this.overtimeModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOvertimeMinutes: { $sum: '$overtimeMinutes' },
          totalAmount: { $sum: '$calculatedAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      data: records,
      aggregates: aggregates[0] || { totalOvertimeMinutes: 0, totalAmount: 0, count: 0 },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPenaltyReport(filters: PenaltyReportFilters, page = 1, limit = 50) {
    const query: any = {};

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.recordDate = {};
      if (filters.startDate) {
        query.recordDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.recordDate.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.penaltyModel
        .find(query)
        .populate('policyId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ recordDate: -1 })
        .exec(),
      this.penaltyModel.countDocuments(query),
    ]);

    // Calculate aggregates
    const aggregates = await this.penaltyModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalMinutes: { $sum: '$minutes' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      data: records,
      aggregates: aggregates[0] || { totalAmount: 0, totalMinutes: 0, count: 0 },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportAttendanceReportCSV(filters: AttendanceReportFilters): Promise<string> {
    const records = await this.attendanceModel
      .find(this.buildAttendanceQuery(filters))
      .sort({ recordDate: -1 })
      .exec();

    const headers = ['Record ID', 'Date', 'Employee ID', 'Total Work Minutes', 'Punch Count', 'Has Missed Punch', 'Exception Count', 'Finalized'];
    const rows = records.map(record => {
      return [
        record._id.toString(),
        record.recordDate?.toISOString().split('T')[0] || '',
        record.employeeId.toString(),
        record.totalWorkMinutes.toString(),
        record.punches?.length?.toString() || '0',
        record.hasMissedPunch ? 'Yes' : 'No',
        record.exceptionIds?.length?.toString() || '0',
        record.finalisedForPayroll ? 'Yes' : 'No',
      ];
    });

    return this.generateCSV(headers, rows);
  }

  async exportOvertimeReportCSV(filters: OvertimeReportFilters): Promise<string> {
    const records = await this.overtimeModel
      .find(this.buildOvertimeQuery(filters))
      .populate('policyId', 'name')
      .sort({ recordDate: -1 })
      .exec();

    const headers = ['Date', 'Employee ID', 'Overtime Minutes', 'Multiplier', 'Amount', 'Status', 'Is Weekend'];
    const rows = records.map(record => [
      record.recordDate.toISOString().split('T')[0],
      record.employeeId.toString(),
      record.overtimeMinutes.toString(),
      record.multiplier.toString(),
      record.calculatedAmount.toString(),
      record.status,
      record.isWeekend ? 'Yes' : 'No',
    ]);

    return this.generateCSV(headers, rows);
  }

  async exportPenaltyReportCSV(filters: PenaltyReportFilters): Promise<string> {
    const records = await this.penaltyModel
      .find(this.buildPenaltyQuery(filters))
      .populate('policyId', 'name')
      .sort({ recordDate: -1 })
      .exec();

    const headers = ['Date', 'Employee ID', 'Type', 'Minutes', 'Amount', 'Status'];
    const rows = records.map(record => [
      record.recordDate.toISOString().split('T')[0],
      record.employeeId.toString(),
      record.type,
      record.minutes.toString(),
      record.amount.toString(),
      record.status,
    ]);

    return this.generateCSV(headers, rows);
  }

  private buildAttendanceQuery(filters: AttendanceReportFilters): any {
    const query: any = {};
    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.startDate || filters.endDate) {
      query.recordDate = {};
      if (filters.startDate) query.recordDate.$gte = filters.startDate;
      if (filters.endDate) query.recordDate.$lte = filters.endDate;
    }
    return query;
  }

  private buildOvertimeQuery(filters: OvertimeReportFilters): any {
    const query: any = {};
    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.recordDate = {};
      if (filters.startDate) query.recordDate.$gte = filters.startDate;
      if (filters.endDate) query.recordDate.$lte = filters.endDate;
    }
    return query;
  }

  private buildPenaltyQuery(filters: PenaltyReportFilters): any {
    const query: any = {};
    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.recordDate = {};
      if (filters.startDate) query.recordDate.$gte = filters.startDate;
      if (filters.endDate) query.recordDate.$lte = filters.endDate;
    }
    return query;
  }

  private generateCSV(headers: string[], rows: string[][]): string {
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvRows = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ];

    return csvRows.join('\n');
  }
}

