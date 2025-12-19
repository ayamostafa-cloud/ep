import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PolicyService } from '../services/policy.service';
import { PolicyEngineService } from '../services/policy-engine.service';
import { TimePolicy, PolicyScope } from '../schemas/time-policy.schema';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';

@Controller('policies')
export class PolicyController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly policyEngineService: PolicyEngineService,
  ) {}

  @Post()
  async create(@Body() policyData: any) {
    // Map user-friendly field names to schema field names
    const mappedData: Partial<TimePolicy> = { ...policyData };
    
    // Map latenessRule fields
    if (policyData.latenessRule) {
      const latenessRule: any = { ...policyData.latenessRule };
      // Support both naming conventions
      if (latenessRule.graceMinutes !== undefined && latenessRule.gracePeriodMinutes === undefined) {
        latenessRule.gracePeriodMinutes = latenessRule.graceMinutes;
        delete latenessRule.graceMinutes;
      }
      if (latenessRule.penaltyPerMinute !== undefined && latenessRule.deductionPerMinute === undefined) {
        latenessRule.deductionPerMinute = latenessRule.penaltyPerMinute;
        delete latenessRule.penaltyPerMinute;
      }
      mappedData.latenessRule = latenessRule;
    }
    
    return this.policyService.create(mappedData);
  }

  @Get()
  async findAll(
    @Query('scope') scope?: PolicyScope,
    @Query('active') active?: string,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const filters: any = {};
    if (scope) filters.scope = scope;
    if (active !== undefined) filters.active = active === 'true';
    if (departmentId) filters.departmentId = new Types.ObjectId(departmentId);
    if (employeeId) filters.employeeId = new Types.ObjectId(employeeId);

    return this.policyService.findAll(filters);
  }

  @Get(':id')
  async findById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.policyService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateData: any,
  ) {
    // Map user-friendly field names to schema field names
    const mappedData: Partial<TimePolicy> = { ...updateData };
    
    // Map latenessRule fields
    if (updateData.latenessRule) {
      const latenessRule: any = { ...updateData.latenessRule };
      // Support both naming conventions
      if (latenessRule.graceMinutes !== undefined && latenessRule.gracePeriodMinutes === undefined) {
        latenessRule.gracePeriodMinutes = latenessRule.graceMinutes;
        delete latenessRule.graceMinutes;
      }
      if (latenessRule.penaltyPerMinute !== undefined && latenessRule.deductionPerMinute === undefined) {
        latenessRule.deductionPerMinute = latenessRule.penaltyPerMinute;
        delete latenessRule.penaltyPerMinute;
      }
      mappedData.latenessRule = latenessRule;
    }
    
    return this.policyService.update(id, mappedData);
  }

  @Delete(':id')
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.policyService.delete(id);
    return { message: 'Policy deleted successfully' };
  }

  @Post(':id/assign/employee')
  async assignToEmployee(
    @Param('id', ParseObjectIdPipe) policyId: Types.ObjectId,
    @Body('employeeId', ParseObjectIdPipe) employeeId: Types.ObjectId,
  ) {
    return this.policyService.assignToEmployee(policyId, employeeId);
  }

  @Post(':id/assign/department')
  async assignToDepartment(
    @Param('id', ParseObjectIdPipe) policyId: Types.ObjectId,
    @Body('departmentId', ParseObjectIdPipe) departmentId: Types.ObjectId,
  ) {
    return this.policyService.assignToDepartment(policyId, departmentId);
  }

  @Post('compute/:attendanceRecordId')
  async computePolicyResults(
    @Param('attendanceRecordId', ParseObjectIdPipe) attendanceRecordId: Types.ObjectId,
    @Body() body: {
      recordDate: string;
      scheduledStartTime?: string;
      scheduledEndTime?: string;
      scheduledMinutes?: number;
    },
  ) {
    const result = await this.policyEngineService.recalculatePolicyResults(
      attendanceRecordId,
      new Date(body.recordDate),
      body.scheduledStartTime ? new Date(body.scheduledStartTime) : undefined,
      body.scheduledEndTime ? new Date(body.scheduledEndTime) : undefined,
      body.scheduledMinutes,
    );

    await this.policyEngineService.saveComputedResults(result);

    return result;
  }
}

