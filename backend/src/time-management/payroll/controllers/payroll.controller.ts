import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PayrollService } from '../services/payroll.service';
import { PrePayrollService } from '../services/pre-payroll.service';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';

@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly prePayrollService: PrePayrollService,
  ) {}

  @Post('sync')
  async syncPayroll(
    @Body() body: {
      periodStart: string;
      periodEnd: string;
      employeeIds?: string[];
      initiatedBy?: string;
    },
  ) {
    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    const employeeIds = body.employeeIds?.map(id => new Types.ObjectId(id));
    const initiatedBy = body.initiatedBy ? new Types.ObjectId(body.initiatedBy) : undefined;

    return this.payrollService.syncPayroll(periodStart, periodEnd, initiatedBy, employeeIds);
  }

  @Get('sync-status/:id')
  async getSyncStatus(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.payrollService.getSyncStatus(id);
  }

  @Post('sync/:id/retry')
  async retrySync(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.payrollService.retryPayrollSync(id);
  }

  @Post('pre-payroll/validate')
  async validatePrePayroll(
    @Body() body: {
      periodStart: string;
      periodEnd: string;
    },
  ) {
    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);

    return this.payrollService.validatePrePayroll(periodStart, periodEnd);
  }

  @Post('pre-payroll/closure')
  async runPrePayrollClosure(
    @Body() body: {
      periodStart: string;
      periodEnd: string;
      escalationDeadlineHours?: number;
    },
  ) {
    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    const escalationDeadlineHours = body.escalationDeadlineHours || 24;

    return this.prePayrollService.runPrePayrollClosure(
      periodStart,
      periodEnd,
      escalationDeadlineHours,
    );
  }

  @Get('payload')
  async generatePayload(
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
    @Query('employeeIds') employeeIds?: string,
  ) {
    if (!periodStart || !periodEnd) {
      throw new BadRequestException('periodStart and periodEnd query parameters are required');
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (isNaN(start.getTime())) {
      throw new BadRequestException(`Invalid periodStart date: ${periodStart}`);
    }

    if (isNaN(end.getTime())) {
      throw new BadRequestException(`Invalid periodEnd date: ${periodEnd}`);
    }

    if (start >= end) {
      throw new BadRequestException('periodStart must be before periodEnd');
    }

    const empIds = employeeIds
      ? employeeIds.split(',').map(id => new Types.ObjectId(id))
      : undefined;

    return this.payrollService.generatePayrollPayload(start, end, empIds);
  }
}

