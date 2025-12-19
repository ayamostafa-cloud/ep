import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  Query,
  ForbiddenException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { EmployeeProfileService } from './employee-profile.service';

import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import {
  EMPLOYEE_ROLES,
  MANAGER_ROLES,
  HR_ROLES,
  ADMIN_ROLES,
} from '../common/constants/role-groups';

import { SystemRole as RoleEnum } from './enums/employee-profile.enums';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SelfUpdateDto } from './dto/self-update.dto';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { CreateManagerDto } from './dto/create-manager.dto';

@Controller('employee-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeProfileController {
  constructor(
    private readonly employeeProfileService: EmployeeProfileService,
  ) {}

  /* =====================================================
     PROFILE
  ===================================================== */

  @Get('profile/me')
  @Roles(...EMPLOYEE_ROLES, ...MANAGER_ROLES, ...HR_ROLES, ...ADMIN_ROLES)
  getMyProfile(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated ❌');
    return this.employeeProfileService.getMyProfile(userId);
  }
@Patch('self-update')
  @Roles(...EMPLOYEE_ROLES)
  selfUpdate(@Req() req: any, @Body() dto: SelfUpdateDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated ❌');
    return this.employeeProfileService.selfUpdate(userId, dto);
  }
  @Get(':id')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  findOne(@Param('id') id: string) {
    return this.employeeProfileService.findOne(id);
  }

  @Get()
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('role') role?: RoleEnum,
  ) {
    return this.employeeProfileService.findAll(+page, +limit, role);
  }

  @Post()
  @Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeProfileService.create(dto);
  }

  @Patch(':id')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeProfileService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  remove(@Param('id') id: string) {
    return this.employeeProfileService.deactivate(id);
  }

  

  /* =====================================================
     MANAGERS
  ===================================================== */

  @Post('create-manager')
  @Roles(...ADMIN_ROLES)
  createManager(@Body() dto: CreateManagerDto) {
    return this.employeeProfileService.createManager(dto);
  }

  @Patch('assign-manager')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  assignManager(
    @Body('employeeId') employeeId: string,
    @Body('managerId') managerId: string,
  ) {
    return this.employeeProfileService.assignManager(employeeId, managerId);
  }

  @Get('manager/team/:managerId')
  @Roles(...MANAGER_ROLES)
  getManagerTeam(@Param('managerId') managerId: string) {
    return this.employeeProfileService.getTeamSummaryForManager(managerId);
  }

  @Get('manager/team/:managerId/employee/:employeeId')
  @Roles(...MANAGER_ROLES)
  getTeamEmployee(
    @Param('managerId') managerId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.employeeProfileService.getTeamEmployeeSummary(
      managerId,
      employeeId,
    );
  }

  /* =====================================================
     CHANGE REQUESTS (EMPLOYEE)
  ===================================================== */

  @Post('change-requests')
  @Roles(...EMPLOYEE_ROLES)
  createChangeRequest(@Req() req: any, @Body() dto: CreateChangeRequestDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated ❌');
    return this.employeeProfileService.createChangeRequest(userId, dto);
  }

  // ✅ FIXED: employee can see ONLY his requests
  @Get('change-requests/my')
  @Roles(...EMPLOYEE_ROLES)
  getMyChangeRequests(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated ❌');
    return this.employeeProfileService.getEmployeeChangeRequests(userId);
  }

  @Patch('change-requests/:id/withdraw')
  @Roles(...EMPLOYEE_ROLES)
  withdrawChangeRequest(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role !== RoleEnum.DEPARTMENT_EMPLOYEE) {
      throw new ForbiddenException('You do not have permission ❌');
    }
    return this.employeeProfileService.withdrawChangeRequest(id);
  }

  @Post('change-requests/:id/dispute')
  @Roles(...EMPLOYEE_ROLES)
  submitDispute(
    @Req() req: any,
    @Param('id') originalRequestId: string,
    @Body() body: { dispute: string },
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated ❌');

    return this.employeeProfileService.submitDispute({
      employeeProfileId: userId,
      originalRequestId,
      dispute: body.dispute,
    });
  }

  /* =====================================================
     CHANGE REQUESTS (HR / ADMIN)
  ===================================================== */

  @Get('change-requests/all')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getAllChangeRequests() {
    return this.employeeProfileService.getAllChangeRequests();
  }

  @Get('change-requests/request/:requestId')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getChangeRequestByUUID(@Param('requestId') requestId: string) {
    return this.employeeProfileService.findChangeRequestByUUID(requestId);
  }

  @Patch('change-requests/:id/approve')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  approveChangeRequest(@Param('id') id: string) {
    return this.employeeProfileService.approveChangeRequest(id);
  }

  @Patch('change-requests/:id/reject')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  rejectChangeRequest(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.employeeProfileService.rejectChangeRequest(id, reason);
  }

  @Patch('change-requests/:id/approve-dispute')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  approveDispute(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
  ) {
    return this.employeeProfileService.approveDispute(id, resolution);
  }

  @Patch('change-requests/:id/resolve-dispute')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  resolveDispute(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
  ) {
    return this.employeeProfileService.resolveDispute(id, resolution);
  }

  /* =====================================================
     DEPARTMENTS
  ===================================================== */

  @Get('department-heads')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getDepartmentHeads() {
    return this.employeeProfileService.getDepartmentHeads();
  }

  @Get('department/:departmentId/managers')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getDepartmentManagers(@Param('departmentId') departmentId: string) {
    return this.employeeProfileService.getDepartmentManagers(departmentId);
  }

  /* =====================================================
     SECURITY
  ===================================================== */

  @Post('set-password/:id')
  @Roles(...ADMIN_ROLES)
  setPassword(
    @Param('id') id: string,
    @Body() dto: { password: string },
  ) {
    return this.employeeProfileService.setPassword(id, dto.password);
  }
}
