import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PayrollTrackingService } from './payroll-tracking.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';

@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(
    private readonly payrollTrackingService: PayrollTrackingService,
  ) {}

  @Get('health')
  getHealth() {
    return this.payrollTrackingService.getHealth();
  }

  
  // CLAIMS
  
  @Post('claims')
  createClaim(@Body() dto: CreateClaimDto) {
    return this.payrollTrackingService.createClaim(dto);
  }

  @Get('claims/:id')
  getClaimById(@Param('id') id: string) {
    return this.payrollTrackingService.getClaimById(id);
  }

  @Get('employees/:employeeId/claims')
  listClaimsByEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.listClaimsByEmployee(employeeId);
  }

  @Patch('claims/:id/status')
  updateClaimStatus(
    @Param('id') id: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.payrollTrackingService.updateClaimStatus(id, dto);
  }

  
  // DISPUTES
  
  @Post('disputes')
  createDispute(@Body() dto: CreateDisputeDto) {
    return this.payrollTrackingService.createDispute(dto);
  }

  @Get('disputes/:id')
  getDisputeById(@Param('id') id: string) {
    return this.payrollTrackingService.getDisputeById(id);
  }

  @Get('employees/:employeeId/disputes')
  listDisputesByEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.listDisputesByEmployee(employeeId);
  }

  @Patch('disputes/:id/status')
  updateDisputeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.payrollTrackingService.updateDisputeStatus(id, dto);
  }

  
  // REFUNDS
  
  @Post('refunds')
  createRefund(@Body() dto: CreateRefundDto) {
    return this.payrollTrackingService.createRefund(dto);
  }

  @Get('refunds/:id')
  getRefundById(@Param('id') id: string) {
    return this.payrollTrackingService.getRefundById(id);
  }

  @Get('employees/:employeeId/refunds')
  listRefundsByEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.listRefundsByEmployee(employeeId);
  }

  @Patch('refunds/:id/status')
  updateRefundStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    return this.payrollTrackingService.updateRefundStatus(id, dto);
  }



  @Get('payslips/:id')
  getPayslipById(@Param('id') id: string) {
    return this.payrollTrackingService.getPayslipById(id);
  }

  @Get('employees/:employeeId/payslips')
  listPayslipsByEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.listPayslipsByEmployee(employeeId);
  }

  @Get('employees/:employeeId/payslips/status/:payslipId')
  getPayslipStatus(@Param('payslipId') payslipId: string) {
    return this.payrollTrackingService.getPayslipStatus(payslipId);
  }

  @Get('employees/:employeeId/payslips/period/:payrollRunId')
  getPayslipByEmployeeAndPeriod(
    @Param('employeeId') employeeId: string,
    @Param('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollTrackingService.getPayslipByEmployeeAndPeriod(
      employeeId,
      payrollRunId,
    );
  }

  // ======================
  // HISTORICAL RECORDS (Phase 1)
  // ======================

  @Get('employees/:employeeId/historical-records')
  getHistoricalSalaryRecords(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payrollTrackingService.getHistoricalSalaryRecords(
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ======================
  // CERTIFICATES (Phase 1)
  // ======================

  @Get('employees/:employeeId/certificates/tax/:year')
  generateTaxCertificate(
    @Param('employeeId') employeeId: string,
    @Param('year') year: string,
  ) {
    return this.payrollTrackingService.generateTaxCertificate(
      employeeId,
      parseInt(year),
    );
  }

  @Get('employees/:employeeId/certificates/insurance/:year')
  generateInsuranceCertificate(
    @Param('employeeId') employeeId: string,
    @Param('year') year: string,
  ) {
    return this.payrollTrackingService.generateInsuranceCertificate(
      employeeId,
      parseInt(year),
    );
  }

  // ======================
  // REPORTS (Phase 2)
  // ======================

  @Get('reports/department/:departmentId')
  getDepartmentReport(
    @Param('departmentId') departmentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payrollTrackingService.getDepartmentReport(
      departmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reports/month-end/:month/:year')
  getMonthEndSummary(
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.payrollTrackingService.getMonthEndSummary(
      parseInt(month),
      parseInt(year),
    );
  }

  @Get('reports/year-end/:year')
  getYearEndSummary(@Param('year') year: string) {
    return this.payrollTrackingService.getYearEndSummary(parseInt(year));
  }

  @Get('reports/taxes')
  getTaxReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payrollTrackingService.getTaxReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reports/insurance')
  getInsuranceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payrollTrackingService.getInsuranceReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reports/benefits')
  getBenefitsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payrollTrackingService.getBenefitsReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
