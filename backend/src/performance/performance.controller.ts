import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';

import { CreateAppraisalRecordDto } from './dto/create-appraisal-record.dto';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { UpdateAppraisalStatusDto } from './dto/update-appraisal-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES, EMPLOYEE_ROLES, HR_ROLES, MANAGER_ROLES } from '../common/constants/role-groups';
import { NotFoundException } from '@nestjs/common';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // ======================================================
  // TEMPLATES
  // ======================================================

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  createTemplate(@Body() body: any) {
    return this.performanceService.createTemplate(body);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  getAllTemplates() {
    return this.performanceService.getAllTemplates();
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  getTemplateById(@Param('id') id: string) {
    return this.performanceService.getTemplateById(id);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.performanceService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  deleteTemplate(@Param('id') id: string) {
    return this.performanceService.deleteTemplate(id);
  }

  // ======================================================
  // CYCLES
  // ======================================================

  @Post('cycles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  createCycle(@Body() body: any) {
    return this.performanceService.createCycle(body);
  }

  @Get('cycles')
   @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  getAllCycles() {
    return this.performanceService.getAllCycles();
  }

  @Get('cycles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  getCycleById(@Param('id') id: string) {
    return this.performanceService.getCycleById(id);
  }

  @Patch('cycles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  updateCycle(@Param('id') id: string, @Body() body: any) {
    return this.performanceService.updateCycle(id, body);
  }

  @Patch('cycles/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  activateCycle(@Param('id') id: string) {
    return this.performanceService.activateCycle(id);
  }

  @Patch('cycles/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  closeCycle(@Param('id') id: string) {
    return this.performanceService.closeCycle(id);
  }

  @Patch('cycles/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  archiveCycle(@Param('id') id: string) {
    return this.performanceService.archiveCycle(id);
  }

  // ======================================================
  // APPRAISALS (MANAGER + HR)
  // ======================================================


  @Post('appraisals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES) // ✅ added HR 
  createAppraisal(@Body() dto: CreateAppraisalRecordDto, @Req() req: any) {
    const managerProfileId = req.user.id;
    return this.performanceService.createAppraisal(dto, managerProfileId);
  }

  @Patch('appraisals/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES) // ✅ added HR
  updateAppraisal(
    @Param('id') id: string,
    @Body() dto: UpdateAppraisalRecordDto,
    @Req() req: any,
  ) {
    const managerProfileId = req.user.id;
    return this.performanceService.updateAppraisal(id, dto, managerProfileId);
  }


  @Patch('appraisals/:id/status')
   @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES) // ✅ added HR
  updateAppraisalStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppraisalStatusDto,
    @Req() req: any,
  ) {
    const managerProfileId = req.user.id;
    return this.performanceService.updateAppraisalStatus(id, dto, managerProfileId);
  }


  @Patch('appraisals/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles( ...HR_ROLES, ...ADMIN_ROLES) // ✅ added HR
  publishAppraisal(
    @Param('id') id: string,
    @Body() dto: UpdateAppraisalStatusDto,
    @Req() req: any,
  ) {
    const hrEmployeeProfileId = req.user.id;
    return this.performanceService.publishAppraisal(id, hrEmployeeProfileId, dto);
  }
  @Get('appraisals/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  getAppraisalById(@Param('id') id: string) {
    return this.performanceService.getAppraisalById(id);
  }
  @Get('cycles/:cycleId/appraisals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  getCycleAppraisals(@Param('cycleId') cycleId: string) {
    return this.performanceService.findCycleAppraisals(cycleId);
  }

  // ======================================================
  // EMPLOYEE VIEW THEIR OWN APPRAISALS
  // ======================================================

  @Get('my-appraisals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  getMyAppraisals(@Req() req: any) {
    const employeeProfileId = req.user.id;
    return this.performanceService.findMyAppraisals(employeeProfileId);
  }


  @Get('my-appraisals/:id')
   @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  getMyAppraisalById(@Param('id') id: string, @Req() req: any) {
    const employeeProfileId = req.user.id;
    return this.performanceService.findMyAppraisalById(employeeProfileId, id);
  }

  // ======================================================
  // EMPLOYEE ACKNOWLEDGEMENT
  // ======================================================


  @Patch('my-appraisals/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  acknowledgeAppraisal(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const employeeProfileId = req.user.id;

    return this.performanceService.employeeAcknowledgeAppraisal(
      id,
      employeeProfileId,
      body.employeeAcknowledgementComment,
    );
  }
@Patch('cycles/:id/publish-results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...ADMIN_ROLES)
publishCycleResults(@Param('id') id: string) {
  return this.performanceService.publishCycleResults(id);
}
@Delete('disputes/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...ADMIN_ROLES)
deleteDispute(@Param('id') id: string) {
  return this.performanceService.deleteDispute(id);
}

  // ======================================================
  // DISPUTES
  // ======================================================


  @Post('appraisals/:id/disputes')
    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  createDispute(
    @Param('id') appraisalId: string,
    @Body() dto: CreateDisputeDto,
    @Req() req: any,
  ) {
    const employeeProfileId = req.user.id;
    return this.performanceService.createDispute(appraisalId, dto, employeeProfileId);
  }

  @Get('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
listDisputes(@Query('status') status?: string) {
  return this.performanceService.listDisputes(status);
}



@Patch('disputes/:id/resolve')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...ADMIN_ROLES)
resolveDispute(
  @Param('id') id: string,
  @Body() dto: ResolveDisputeDto,
  @Req() req: any
) {
  const hrEmployeeProfileId = req.user.id;
  return this.performanceService.resolveDispute(id, dto, hrEmployeeProfileId);
}

@Get('disputes/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES, ...EMPLOYEE_ROLES)
async getDisputeById(@Param('id') id: string) {
  const dispute = await this.performanceService.getDisputeById(id);
  if (!dispute) {
    throw new NotFoundException('Dispute not found');
  }
  return dispute;
}
}