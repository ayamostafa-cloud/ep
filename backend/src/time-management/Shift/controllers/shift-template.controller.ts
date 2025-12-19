import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShiftTemplateService } from '../services/shift-template.service';
import { CreateShiftTemplateDto } from '../dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from '../dto/update-shift-template.dto';
import { ShiftTemplateResponseDto } from '../dto/shift-template-response.dto';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('shifts')
@Controller('time-management/shifts')
@UseGuards(RolesGuard)
export class ShiftTemplateController {
  constructor(private readonly shiftTemplateService: ShiftTemplateService) {}

  /**
   * Create a new shift template
   * POST /time-management/shifts
   *
   * Supports multiple shift types:
   * - normal: Standard fixed hours (requires startTime, endTime)
   * - split: Split shift with break (requires startTime, endTime)
   * - overnight: Shift crossing midnight (requires startTime, endTime, isOvernight=true)
   * - rotational: Rotating schedule pattern (requires startTime, endTime, rotationalPattern)
   * - flexible: Flexible hours within a window (requires flexibleStartWindow, flexibleEndWindow, requiredHours)
   * - compressed: Compressed workweek (requires workDaysPerWeek, hoursPerDay)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('HR Manager', 'System Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new shift template',
    description:
      'Create shift templates for various work arrangements including normal, split, overnight, rotational, flexible hours, and compressed workweeks. Each type has specific required fields.',
  })
  @ApiBody({ type: CreateShiftTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Shift template created successfully',
    type: ShiftTemplateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or missing required fields for shift type',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - HR Manager or System Admin role required',
  })
  async create(@Body() createDto: CreateShiftTemplateDto) {
    return await this.shiftTemplateService.create(createDto);
  }

  /**
   * Get all shift templates
   * GET /time-management/shifts
   */
  @Get()
  @ApiOperation({ summary: 'Get all shift templates' })
  @ApiResponse({
    status: 200,
    description: 'List of shift templates',
    type: [ShiftTemplateResponseDto],
  })
  async findAll() {
    return await this.shiftTemplateService.findAll();
  }

  /**
   * Get shift template by ID
   * GET /time-management/shifts/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get shift template by ID' })
  @ApiParam({ name: 'id', description: 'Shift template ID' })
  @ApiResponse({
    status: 200,
    description: 'Shift template details',
    type: ShiftTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Shift template not found' })
  async findOne(@Param('id') id: string) {
    return await this.shiftTemplateService.findById(id);
  }

  /**
   * Update shift template
   * PATCH /time-management/shifts/:id
   */
  @Patch(':id')
  @Roles('HR Manager', 'System Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shift template' })
  @ApiParam({ name: 'id', description: 'Shift template ID' })
  @ApiBody({ type: UpdateShiftTemplateDto })
  @ApiResponse({
    status: 200,
    description: 'Shift template updated successfully',
    type: ShiftTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Shift template not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - HR Manager or System Admin role required',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateShiftTemplateDto,
  ) {
    return await this.shiftTemplateService.update(id, updateDto);
  }

  /**
   * Delete shift template
   * DELETE /time-management/shifts/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('HR Manager', 'System Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete shift template' })
  @ApiParam({ name: 'id', description: 'Shift template ID' })
  @ApiResponse({
    status: 204,
    description: 'Shift template deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Shift template not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - HR Manager or System Admin role required',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete: active assignments exist',
  })
  async remove(@Param('id') id: string) {
    await this.shiftTemplateService.delete(id);
  }
}
