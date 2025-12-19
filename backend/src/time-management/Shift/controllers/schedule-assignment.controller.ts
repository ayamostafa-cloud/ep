import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScheduleAssignmentService } from '../services/schedule-assignment.service';
import { CreateScheduleAssignmentDto } from '../dto/create-schedule-assignment.dto';
import { BulkAssignShiftDto } from '../dto/bulk-assign-shift.dto';
import { QueryAssignmentsDto } from '../dto/query-assignments.dto';
import { UpdateAssignmentStatusDto } from '../dto/update-assignment-status.dto';
import { ScheduleAssignmentResponseDto } from '../dto/schedule-assignment-response.dto';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('assignments')
@Controller('time-management')
@UseGuards(RolesGuard)
export class ScheduleAssignmentController {
  constructor(
    private readonly scheduleAssignmentService: ScheduleAssignmentService,
  ) {}

  /**
   * Assign shift template to employee/department/position (single assignment)
   * POST /time-management/shifts/assign
   */
  @Post('shifts/assign')
  @HttpCode(HttpStatus.CREATED)
  @Roles('HR Manager', 'System Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign shift template to employee/department/position',
  })
  @ApiBody({ type: CreateScheduleAssignmentDto })
  @ApiResponse({
    status: 201,
    description: 'Assignment created successfully',
    type: ScheduleAssignmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - HR Manager or System Admin role required',
  })
  @ApiResponse({
    status: 409,
    description: 'Assignment conflicts with existing active assignment',
  })
  async assign(@Body() createDto: CreateScheduleAssignmentDto) {
    return await this.scheduleAssignmentService.assign(createDto);
  }

  /**
   * Bulk assign shift template to multiple employees/departments/positions
   * POST /time-management/shifts/assign/bulk
   */
  @Post('shifts/assign/bulk')
  @Roles('HR Manager', 'System Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk assign shift template to multiple employees',
    description:
      'Assign a shift template to multiple employees, all employees in a department, or all employees with a specific position. Examples provided below.',
  })
  @ApiBody({
    type: BulkAssignShiftDto,
    examples: {
      'bulk-by-employees': {
        summary: 'Bulk assign to specific employees',
        description: 'Assign shift to multiple specific employees by their IDs',
        value: {
          shiftTemplateId: '507f1f77bcf86cd799439011',
          employeeIds: [
            '507f1f77bcf86cd799439012',
            '507f1f77bcf86cd799439013',
            '507f1f77bcf86cd799439014',
          ],
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: '2025-12-31T23:59:59.000Z',
          assignedBy: '507f1f77bcf86cd799439015',
          reason: 'New year shift assignment for customer service team',
        },
      },
      'bulk-by-department': {
        summary: 'Bulk assign to department',
        description: 'Assign shift to all employees in a department',
        value: {
          shiftTemplateId: '507f1f77bcf86cd799439011',
          departmentId: '507f1f77bcf86cd799439016',
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: null,
          assignedBy: '507f1f77bcf86cd799439015',
          reason: 'Department-wide shift change',
        },
      },
      'bulk-by-position': {
        summary: 'Bulk assign to position',
        description: 'Assign shift to all employees with a specific position',
        value: {
          shiftTemplateId: '507f1f77bcf86cd799439011',
          positionId: '507f1f77bcf86cd799439017',
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: '2025-06-30T23:59:59.000Z',
          assignedBy: '507f1f77bcf86cd799439015',
          reason: 'Temporary shift for managers during peak season',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk assignment completed',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'number',
          description: 'Number of successful assignments',
          example: 5,
        },
        failed: {
          type: 'number',
          description: 'Number of failed assignments',
          example: 1,
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              employeeId: { type: 'string' },
              error: { type: 'string' },
            },
          },
          example: [
            {
              employeeId: '507f1f77bcf86cd799439018',
              error: 'Assignment conflicts with existing active assignment',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input - exactly one of employeeIds, departmentId, or positionId must be provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - HR Manager or System Admin role required',
  })
  async bulkAssign(@Body() bulkDto: BulkAssignShiftDto) {
    return await this.scheduleAssignmentService.bulkAssign(bulkDto);
  }

  /**
   * Query schedule assignments with filters
   * GET /time-management/scheduling/assignments
   */
  @Get('scheduling/assignments')
  @ApiOperation({ summary: 'Query schedule assignments with filters' })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'Filter by employee ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'positionId',
    required: false,
    description: 'Filter by position ID',
  })
  @ApiQuery({
    name: 'shiftTemplateId',
    required: false,
    description: 'Filter by shift template ID',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date for calendar view',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'End date for calendar view',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filter by status (Active, Inactive, Cancelled, Approved, Expired)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assignments',
    type: [ScheduleAssignmentResponseDto],
  })
  async query(@Query() queryDto: QueryAssignmentsDto) {
    return await this.scheduleAssignmentService.query(queryDto);
  }

  /**
   * Get assignment by ID
   * GET /time-management/scheduling/assignments/:id
   */
  @Get('scheduling/assignments/:id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Assignment details',
    type: ScheduleAssignmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async findOne(@Param('id') id: string) {
    return await this.scheduleAssignmentService.findById(id);
  }

  /**
   * Update assignment status
   * PATCH /time-management/scheduling/assignments/:id/status
   */
  @Patch('scheduling/assignments/:id/status')
  @Roles('HR Manager', 'System Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update assignment status',
    description:
      'Update assignment status to Active, Inactive, Cancelled, Approved, or Expired',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiBody({ type: UpdateAssignmentStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Assignment status updated successfully',
    type: ScheduleAssignmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid status or validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - HR Manager or System Admin role required',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssignmentStatusDto,
  ) {
    return await this.scheduleAssignmentService.updateStatus(id, updateDto);
  }
}
