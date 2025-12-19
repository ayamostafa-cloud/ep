import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';

import { LeavesService } from './leaves.service';

import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { CreateLeaveEntitlementDto } from './dto/create-leave-entitlement.dto';
import { UpdateLeaveEntitlementDto } from './dto/update-leave-entitlement.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ApproveAdjustmentDto } from './dto/approve-adjustment.dto';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { CreateBlockedPeriodDto } from './dto/create-blocked-period.dto';

@Controller()
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  // ===================================================
  // LEAVE TYPE
  // ===================================================
  @Post('leave-type')
  createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.service.leaveType.create(dto);
  }

  @Get('leave-type')
  findAllLeaveTypes() {
    return this.service.leaveType.findAll();
  }

  @Get('leave-type/:id')
  findLeaveType(@Param('id') id: string) {
    return this.service.leaveType.findOne(id);
  }

  @Get('leave-type/code/:code')
  findLeaveTypeByCode(@Param('code') code: string) {
    return this.service.leaveType.findByCode(code);
  }

  @Patch('leave-type/:id')
  updateLeaveType(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.service.leaveType.update(id, dto);
  }

  @Delete('leave-type/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLeaveType(@Param('id') id: string) {
    return this.service.leaveType.remove(id);
  }

  // ===================================================
  // LEAVE POLICY
  // ===================================================
  @Post('leave-policy')
  createPolicy(@Body() dto: CreatePolicyDto) {
    return this.service.leavePolicy.create(dto);
  }

  @Get('leave-policy')
  findAllPolicies() {
    return this.service.leavePolicy.findAll();
  }

  @Get('leave-policy/:id')
  findPolicy(@Param('id') id: string) {
    return this.service.leavePolicy.findOne(id);
  }

  @Patch('leave-policy/:id')
  updatePolicy(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    return this.service.leavePolicy.update(id, dto);
  }

  @Delete('leave-policy/:id')
  removePolicy(@Param('id') id: string) {
    return this.service.leavePolicy.remove(id);
  }

  // ===================================================
  // LEAVE REQUEST
  // ===================================================
  @Post('leave-request')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createRequest(@Body() dto: CreateLeaveRequestDto) {
    return this.service.leaveRequest.create(dto);
  }

  @Get('leave-request')
  findAllRequests() {
    return this.service.leaveRequest.findAll();
  }

  @Get('leave-request/:id')
  findRequest(@Param('id') id: string) {
    return this.service.leaveRequest.findOne(id);
  }

  @Put('leave-request/:id')
  updateRequest(@Param('id') id: string, @Body() dto: UpdateLeaveRequestDto) {
    return this.service.leaveRequest.update(id, dto);
  }

  @Put('leave-request/:id/approve/manager')
  approveReq(@Param('id') id: string, @Body() dto: ApproveRequestDto) {
    return this.service.leaveRequest.managerApprove(id, dto.approverId);
  }

  @Put('leave-request/:id/reject/manager')
  rejectReq(@Param('id') id: string, @Body() dto: ApproveRequestDto) {
    return this.service.leaveRequest.managerReject(
      id,
      dto.approverId,
      dto.comment,
    );
  }

  // ===================================================
  // LEAVE ENTITLEMENT
  // ===================================================
  @Post('leave-entitlement')
  createEntitlement(@Body() dto: CreateLeaveEntitlementDto) {
    return this.service.leaveEntitlement.create(dto);
  }

  @Get('leave-entitlement/:employeeId')
  getEmployeeEnt(@Param('employeeId') employeeId: string) {
    return this.service.leaveEntitlement.findByEmployee(employeeId);
  }

  @Put('leave-entitlement/:employeeId')
  updateEnt(
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateLeaveEntitlementDto,
  ) {
    return this.service.leaveEntitlement.update(employeeId, dto);
  }

  @Delete('leave-entitlement/:employeeId')
  removeEnt(@Param('employeeId') employeeId: string) {
    return this.service.leaveEntitlement.removeByEmployee(employeeId);
  }

  // ===================================================
  // LEAVE ADJUSTMENT
  // ===================================================
  @Post('leave-adjustment')
  createAdjustment(@Body() dto: CreateAdjustmentDto) {
    return this.service.leaveAdjustment.create(dto);
  }

  @Put('leave-adjustment/:id/approve')
  approveAdjustment(@Param('id') id: string, @Body() dto: ApproveAdjustmentDto) {
    return this.service.leaveAdjustment.approve(id, dto);
  }

  // ===================================================
  // CALENDAR
  // ===================================================
  @Post('calendar')
  createCalendar(@Body() dto: CreateCalendarDto) {
    return this.service.calendar.create(dto);
  }

  @Get('calendar/:year')
  findCalendar(@Param('year', ParseIntPipe) year: number) {
    return this.service.calendar.findByYear(year);
  }

  @Patch('calendar/:year')
  updateCalendar(
    @Param('year', ParseIntPipe) year: number,
    @Body() dto: UpdateCalendarDto,
  ) {
    return this.service.calendar.update(year, dto);
  }

  @Post('calendar/:year/blocked-period')
  addBlocked(
    @Param('year', ParseIntPipe) year: number,
    @Body() dto: CreateBlockedPeriodDto,
  ) {
    return this.service.calendar.addBlockedPeriod(year, dto);
  }

  // REMOVE BLOCKED PERIOD
  @Delete('calendar/:year/blocked-period/:index')
  removeBlockedPeriod(
    @Param('year', ParseIntPipe) year: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.service.calendar.removeBlockedPeriod(year, index);
  }

}
