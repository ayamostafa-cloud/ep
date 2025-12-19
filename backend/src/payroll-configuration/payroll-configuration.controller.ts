import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PayrollConfigurationService } from './payroll-configuration.service';
import { ConfigStatus } from './enums/payroll-configuration-enums';
import {
  ApproveInsuranceBracketDto,
  CreateConfigurationDto,
  RejectInsuranceBracketDto,
  UpdateConfigurationDto,
  UpdateInsuranceBracketDto,
} from './dto/payroll-configuration.dto';

@Controller('payroll-configuration')
export class PayrollConfigurationController {
  constructor(
    private readonly payrollConfigurationService: PayrollConfigurationService,
  ) {}

  @Post('insurance-brackets')
  createInsuranceBracket(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createInsuranceBracket(payload);
  }

  @Get('insurance-brackets')
  listInsuranceBrackets(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listInsuranceBrackets(
      normalizedStatus,
    );
  }

  @Get('insurance-brackets/:configId')
  getInsuranceBracket(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getInsuranceBracket(configId);
  }

  @Patch('insurance-brackets/:configId')
  editInsuranceBracket(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateInsuranceBracketDto,
  ) {
    return this.payrollConfigurationService.updateInsuranceBracket(
      configId,
      payload,
    );
  }

  @Patch('insurance-brackets/:configId/approve')
  approveInsuranceBracket(
    @Param('configId') configId: string,
    @Body() { approverId }: ApproveInsuranceBracketDto,
  ) {
    return this.payrollConfigurationService.approveInsuranceBracket(
      configId,
      approverId,
    );
  }

  @Patch('insurance-brackets/:configId/reject')
  rejectInsuranceBracket(
    @Param('configId') configId: string,
    @Body() { reviewerId }: RejectInsuranceBracketDto,
  ) {
    return this.payrollConfigurationService.rejectInsuranceBracket(
      configId,
      reviewerId,
    );
  }

  @Delete('insurance-brackets/:configId')
  deleteInsuranceBracket(@Param('configId') configId: string) {
    return this.payrollConfigurationService.deleteInsuranceBracket(configId);
  }

  // Payroll Policies Configuration Endpoints
  @Post('payroll-policies')
  createPayrollPolicy(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createPayrollPolicy(payload);
  }

  @Get('payroll-policies')
  listPayrollPolicies(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listPayrollPolicies(
      normalizedStatus,
    );
  }

  @Get('payroll-policies/:configId')
  getPayrollPolicy(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getPayrollPolicy(configId);
  }

  @Patch('payroll-policies/:configId')
  updatePayrollPolicy(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updatePayrollPolicy(
      configId,
      payload,
    );
  }

  // Pay Grades Configuration Endpoints
  @Post('pay-grades')
  createPayGrade(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createPayGrade(payload);
  }

  @Get('pay-grades')
  listPayGrades(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listPayGrades(normalizedStatus);
  }

  @Get('pay-grades/:configId')
  getPayGrade(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getPayGrade(configId);
  }

  @Patch('pay-grades/:configId')
  updatePayGrade(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updatePayGrade(configId, payload);
  }

  // Pay Types Configuration Endpoints
  @Post('pay-types')
  createPayType(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createPayType(payload);
  }

  @Get('pay-types')
  listPayTypes(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listPayTypes(normalizedStatus);
  }

  @Get('pay-types/:configId')
  getPayType(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getPayType(configId);
  }

  @Patch('pay-types/:configId')
  updatePayType(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updatePayType(configId, payload);
  }

  // Allowance Configuration Endpoints
  @Post('allowances')
  createAllowance(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createAllowance(payload);
  }

  @Get('allowances')
  listAllowances(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listAllowances(normalizedStatus);
  }

  @Get('allowances/:configId')
  getAllowance(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getAllowance(configId);
  }

  @Patch('allowances/:configId')
  updateAllowance(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updateAllowance(configId, payload);
  }

  // Signing Bonus Configuration Endpoints
  @Post('signing-bonuses')
  createSigningBonus(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createSigningBonus(payload);
  }

  @Get('signing-bonuses')
  listSigningBonuses(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listSigningBonuses(
      normalizedStatus,
    );
  }

  @Get('signing-bonuses/:configId')
  getSigningBonus(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getSigningBonus(configId);
  }

  @Patch('signing-bonuses/:configId')
  updateSigningBonus(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updateSigningBonus(
      configId,
      payload,
    );
  }

  // Termination and Resignation Benefits Configuration Endpoints
  @Post('termination-resignation-benefits')
  createTerminationResignationBenefits(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createTerminationResignationBenefits(
      payload,
    );
  }

  @Get('termination-resignation-benefits')
  listTerminationResignationBenefits(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listTerminationResignationBenefits(
      normalizedStatus,
    );
  }

  @Get('termination-resignation-benefits/:configId')
  getTerminationResignationBenefits(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getTerminationResignationBenefits(
      configId,
    );
  }

  @Patch('termination-resignation-benefits/:configId')
  updateTerminationResignationBenefits(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updateTerminationResignationBenefits(
      configId,
      payload,
    );
  }

  // Company-Wide Settings Configuration Endpoints
  @Post('company-wide-settings')
  createCompanyWideSettings(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createCompanyWideSettings(payload);
  }

  @Get('company-wide-settings/active')
  getActiveCompanyWideSettings() {
    return this.payrollConfigurationService.getActiveCompanyWideSettings();
  }

  @Get('company-wide-settings')
  listCompanyWideSettings() {
    return this.payrollConfigurationService.listCompanyWideSettings();
  }

  @Get('company-wide-settings/:configId')
  getCompanyWideSettings(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getCompanyWideSettings(configId);
  }

  @Patch('company-wide-settings/:configId')
  updateCompanyWideSettings(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updateCompanyWideSettings(
      configId,
      payload,
    );
  }

  // Tax Rules Configuration Endpoints
  @Post('tax-rules')
  createTaxRule(@Body() payload: CreateConfigurationDto) {
    return this.payrollConfigurationService.createTaxRule(payload);
  }

  @Get('tax-rules')
  listTaxRules(@Query('status') status?: string) {
    const normalizedStatus = this.normalizeStatusFilter(status);
    return this.payrollConfigurationService.listTaxRules(normalizedStatus);
  }

  @Get('tax-rules/:configId')
  getTaxRule(@Param('configId') configId: string) {
    return this.payrollConfigurationService.getTaxRule(configId);
  }

  @Patch('tax-rules/:configId')
  updateTaxRule(
    @Param('configId') configId: string,
    @Body() { payload }: UpdateConfigurationDto,
  ) {
    return this.payrollConfigurationService.updateTaxRule(configId, payload);
  }

  private normalizeStatusFilter(
    rawStatus?: string,
  ): ConfigStatus | undefined {
    if (!rawStatus) {
      return undefined;
    }

    const lowerCased = rawStatus.toLowerCase();
    const allowedStatuses = Object.values(ConfigStatus);
    if (!allowedStatuses.includes(lowerCased as ConfigStatus)) {
      throw new BadRequestException(
        `Unsupported status filter "${rawStatus}". Allowed statuses: ${allowedStatuses.join(
          ', ',
        )}`,
      );
    }

    return lowerCased as ConfigStatus;
  }
}
