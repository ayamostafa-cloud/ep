import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportingService } from '../services/reporting.service';
import { Types } from 'mongoose';
import { PenaltyStatus } from '../../policy/schemas/penalty-record.schema';
import { OvertimeStatus } from '../../policy/schemas/overtime-record.schema';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('attendance')
  async getAttendanceReport(
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeExceptions') includeExceptions?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = new Types.ObjectId(employeeId);
    if (departmentId) filters.departmentId = new Types.ObjectId(departmentId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (includeExceptions) filters.includeExceptions = includeExceptions === 'true';

    return this.reportingService.getAttendanceReport(
      filters,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('attendance/export')
  async exportAttendanceReport(
    @Res() res: Response,
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = new Types.ObjectId(employeeId);
    if (departmentId) filters.departmentId = new Types.ObjectId(departmentId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const csv = await this.reportingService.exportAttendanceReportCSV(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
    res.send(csv);
  }

  @Get('overtime')
  async getOvertimeReport(
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: OvertimeStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = new Types.ObjectId(employeeId);
    if (departmentId) filters.departmentId = new Types.ObjectId(departmentId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (status) filters.status = status;

    return this.reportingService.getOvertimeReport(
      filters,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('overtime/export')
  async exportOvertimeReport(
    @Res() res: Response,
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: OvertimeStatus,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = new Types.ObjectId(employeeId);
    if (departmentId) filters.departmentId = new Types.ObjectId(departmentId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (status) filters.status = status;

    const csv = await this.reportingService.exportOvertimeReportCSV(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=overtime-report.csv');
    res.send(csv);
  }

  @Get('penalties')
  async getPenaltyReport(
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: PenaltyStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = new Types.ObjectId(employeeId);
    if (departmentId) filters.departmentId = new Types.ObjectId(departmentId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (type) filters.type = type;
    if (status) filters.status = status;

    return this.reportingService.getPenaltyReport(
      filters,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('penalties/export')
  async exportPenaltyReport(
    @Res() res: Response,
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: PenaltyStatus,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = new Types.ObjectId(employeeId);
    if (departmentId) filters.departmentId = new Types.ObjectId(departmentId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (type) filters.type = type;
    if (status) filters.status = status;

    const csv = await this.reportingService.exportPenaltyReportCSV(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=penalty-report.csv');
    res.send(csv);
  }
}

