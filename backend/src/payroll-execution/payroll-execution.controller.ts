import { Body, Controller, Get, Optional, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { BonusStatus, BenefitStatus } from './enums/payroll-execution-enum';
import {
  ApproveSigningBonusDto,
  ManualOverrideSigningBonusDto,
  ApproveTerminationBenefitDto,
  ManualOverrideTerminationBenefitDto,
  ReviewPayrollRunDto,
  EditPayrollRunDto,
  ProcessPayrollRunDto,
  CalculatePayrollDto,
  PayrollExecutionService,
} from './payroll-execution.service';

@Controller('payroll-execution')
export class PayrollExecutionController {
  private readonly payrollExecutionService: PayrollExecutionService;

  constructor(
    @Optional() payrollExecutionService?: PayrollExecutionService,
  ) {
    this.payrollExecutionService =
      payrollExecutionService ?? this.createUnavailableServiceProxy();
  }

  @Get('signing-bonuses/processed')
  getProcessedSigningBonuses(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    const normalizedStatus = this.parseStatusQuery(status);
    return this.payrollExecutionService.getProcessedSigningBonuses({
      employeeId,
      status: normalizedStatus,
    });
  }

  @Post('signing-bonuses/:id/approve')
  approveSigningBonus(
    @Param('id') signingBonusId: string,
    @Body() body: ApproveSigningBonusDto = new ApproveSigningBonusDto(),
  ) {
    return this.payrollExecutionService.approveSigningBonus(
      signingBonusId,
      body,
    );
  }

  @Patch('signing-bonuses/:id/manual-override')
  manuallyOverrideSigningBonus(
    @Param('id') signingBonusId: string,
    @Body() body: ManualOverrideSigningBonusDto,
  ) {
    return this.payrollExecutionService.manuallyOverrideSigningBonus(
      signingBonusId,
      body,
    );
  }

  @Get('termination-benefits/processed')
  getProcessedTerminationBenefits(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    const normalizedStatus = this.parseBenefitStatusQuery(status);
    return this.payrollExecutionService.getProcessedTerminationBenefits({
      employeeId,
      status: normalizedStatus,
    });
  }

  @Post('termination-benefits/:id/approve')
  approveTerminationBenefit(
    @Param('id') terminationBenefitId: string,
    @Body() body: ApproveTerminationBenefitDto = new ApproveTerminationBenefitDto(),
  ) {
    return this.payrollExecutionService.approveTerminationBenefit(
      terminationBenefitId,
      body,
    );
  }

  @Patch('termination-benefits/:id/manual-override')
  manuallyOverrideTerminationBenefit(
    @Param('id') terminationBenefitId: string,
    @Body() body: ManualOverrideTerminationBenefitDto,
  ) {
    return this.payrollExecutionService.manuallyOverrideTerminationBenefit(
      terminationBenefitId,
      body,
    );
  }

  @Get('payroll-runs/review')
  getPayrollRunsForReview(
    @Query('status') status?: string,
    @Query('payrollPeriod') payrollPeriod?: string,
  ) {
    return this.payrollExecutionService.getPayrollRunsForReview({
      status,
      payrollPeriod,
    });
  }

  @Post('payroll-runs/:id/review')
  reviewPayrollRun(
    @Param('id') payrollRunId: string,
    @Body() body: ReviewPayrollRunDto,
  ) {
    return this.payrollExecutionService.reviewPayrollRun(payrollRunId, body);
  }

  @Patch('payroll-runs/:id/edit')
  editPayrollRun(
    @Param('id') payrollRunId: string,
    @Body() body: EditPayrollRunDto,
  ) {
    return this.payrollExecutionService.editPayrollRun(payrollRunId, body);
  }

  @Post('payroll-runs/process-automatic')
  processPayrollRunAutomatically(@Body() body: ProcessPayrollRunDto) {
    return this.payrollExecutionService.processPayrollRunAutomatically(body);
  }

  @Post('payroll-runs/calculate-automatic')
  calculatePayrollAutomatically(@Body() body: CalculatePayrollDto) {
    return this.payrollExecutionService.calculatePayrollAutomatically(body);
  }

  @Post('payslips/generate')
  generatePayslip(
    @Body() body: { employeeId: string; payrollRunId: string },
  ) {
    return this.payrollExecutionService.generatePayslip(
      body.employeeId,
      body.payrollRunId,
    );
  }

  @Post('payslips/generate-batch/:payrollRunId')
  generatePayslipsForPayrollRun(@Param('payrollRunId') payrollRunId: string) {
    return this.payrollExecutionService.generatePayslipsForPayrollRun(
      payrollRunId,
    );
  }

  @Get('payslips')
  getPayslip(
    @Query('employeeId') employeeId: string,
    @Query('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollExecutionService.getPayslip(employeeId, payrollRunId);
  }

  @Get('payslips/payroll-run/:payrollRunId')
  getPayslipsForPayrollRun(@Param('payrollRunId') payrollRunId: string) {
    return this.payrollExecutionService.getPayslipsForPayrollRun(payrollRunId);
  }

  @Post('draft/generate-automatic')
  generateDraftPayrollAutomatically(
    @Body() body: { entity: string; payrollSpecialistId?: string; payrollPeriod?: string },
  ) {
    return this.payrollExecutionService.generateDraftPayrollAutomatically(body);
  }

  @Get('preview/:payrollRunId')
  getPayrollPreviewDashboard(@Param('payrollRunId') payrollRunId: string) {
    return this.payrollExecutionService.getPayrollPreviewDashboard(
      payrollRunId,
    );
  }

  @Post('payroll-runs/:id/send-for-manager-approval')
  sendForManagerApproval(
    @Param('id') payrollRunId: string,
    @Body() body: { payrollSpecialistId?: string },
  ) {
    return this.payrollExecutionService.sendForManagerApproval(
      payrollRunId,
      body.payrollSpecialistId,
    );
  }

  @Post('payroll-runs/:id/send-for-finance-approval')
  sendForFinanceApproval(
    @Param('id') payrollRunId: string,
    @Body() body: { payrollManagerId?: string },
  ) {
    return this.payrollExecutionService.sendForFinanceApproval(
      payrollRunId,
      body.payrollManagerId,
    );
  }

  @Post('payroll-runs/:id/final-approval')
  finalApprovalByFinance(
    @Param('id') payrollRunId: string,
    @Body() body: { financeStaffId?: string },
  ) {
    return this.payrollExecutionService.finalApprovalByFinance(
      payrollRunId,
      body.financeStaffId,
    );
  }

  @Get('payroll-runs/:id/escalated-irregularities')
  getEscalatedIrregularities(@Param('id') payrollRunId: string) {
    return this.payrollExecutionService.getEscalatedIrregularities(
      payrollRunId,
    );
  }

  @Post('irregularities/resolve')
  resolveEscalatedIrregularity(
    @Body()
    body: {
      irregularityId: string;
      resolution: string;
      resolvedBy: string;
      action: 'resolve' | 'reject';
    },
  ) {
    return this.payrollExecutionService.resolveEscalatedIrregularity(body);
  }

  @Post('payroll-runs/:id/manager-review-approve')
  managerReviewAndApprove(
    @Param('id') payrollRunId: string,
    @Body() body: { payrollManagerId: string; comment?: string },
  ) {
    return this.payrollExecutionService.managerReviewAndApprove(
      payrollRunId,
      body.payrollManagerId,
      body.comment,
    );
  }

  @Post('payroll-runs/:id/lock')
  lockPayroll(
    @Param('id') payrollRunId: string,
    @Body() body: { payrollManagerId: string; comment?: string },
  ) {
    return this.payrollExecutionService.lockPayroll(payrollRunId, body);
  }

  @Post('payroll-runs/:id/unlock')
  unlockPayroll(
    @Param('id') payrollRunId: string,
    @Body()
    body: { payrollManagerId: string; unlockReason: string; comment?: string },
  ) {
    return this.payrollExecutionService.unlockPayroll(payrollRunId, body);
  }

  @Get('payroll-runs/:id/payslip-distribution-status')
  getPayslipDistributionStatus(@Param('id') payrollRunId: string) {
    return this.payrollExecutionService.getPayslipDistributionStatus(
      payrollRunId,
    );
  }

  @Get('payslips/:id/download')
  downloadPayslipPDF(@Param('id') payslipId: string) {
    return this.payrollExecutionService.downloadPayslipPDF(payslipId);
  }

  @Post('payslips/:id/resend')
  resendPayslip(
    @Param('id') payslipId: string,
    @Body() body: { distributionMethod: 'email' | 'portal' },
  ) {
    return this.payrollExecutionService.resendPayslip(
      payslipId,
      body.distributionMethod,
    );
  }

  private parseStatusQuery(status?: string): BonusStatus | undefined {
    if (!status) {
      return undefined;
    }

    return Object.values(BonusStatus).find(
      (candidate) => candidate.toLowerCase() === status.toLowerCase(),
    );
  }

  private parseBenefitStatusQuery(status?: string): BenefitStatus | undefined {
    if (!status) {
      return undefined;
    }

    return Object.values(BenefitStatus).find(
      (candidate) => candidate.toLowerCase() === status.toLowerCase(),
    );
  }

  private createUnavailableServiceProxy(): PayrollExecutionService {
    return new Proxy(
      {},
      {
        get: (_, prop) => {
          throw new Error(
            `PayrollExecutionService is unavailable (missing provider for "${String(
              prop,
            )}").`,
          );
        },
      },
    ) as PayrollExecutionService;
  }
}
