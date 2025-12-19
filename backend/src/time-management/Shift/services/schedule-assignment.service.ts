import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
// Note: Employee model will need to be imported from the appropriate location
// For now, using Types.ObjectId for employee references
import { CreateScheduleAssignmentDto } from '../dto/create-schedule-assignment.dto';
import { BulkAssignShiftDto } from '../dto/bulk-assign-shift.dto';
import { QueryAssignmentsDto } from '../dto/query-assignments.dto';
import { UpdateAssignmentStatusDto } from '../dto/update-assignment-status.dto';
import { ShiftTemplateService } from './shift-template.service';

@Injectable()
export class ScheduleAssignmentService {
  constructor(
    @InjectModel(ScheduleAssignment.name)
    private scheduleAssignmentModel: Model<ScheduleAssignmentDocument>,
    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>,
    // Note: Employee model removed - will need to be injected from parent module if needed
    private shiftTemplateService: ShiftTemplateService,
  ) {}

  /**
   * Validate assignment data
   */
  private validateAssignment(createDto: CreateScheduleAssignmentDto): void {
    // Exactly one of employeeId, departmentId, or positionId must be provided
    const targetCount = [
      createDto.employeeId,
      createDto.departmentId,
      createDto.positionId,
    ].filter(Boolean).length;
    if (targetCount !== 1) {
      throw new BadRequestException(
        'Exactly one of employeeId, departmentId, or positionId must be provided',
      );
    }

    // Validate date range
    if (
      createDto.effectiveTo &&
      new Date(createDto.effectiveFrom) >= new Date(createDto.effectiveTo)
    ) {
      throw new BadRequestException('effectiveFrom must be before effectiveTo');
    }
  }

  /**
   * Check for conflicting assignments
   */
  private async detectConflicts(
    employeeId: string | undefined,
    departmentId: string | undefined,
    positionId: string | undefined,
    effectiveFrom: Date,
    effectiveTo: Date | null,
    excludeAssignmentId?: string,
  ): Promise<ScheduleAssignmentDocument[]> {
    const query: any = {
      status: 'Active',
      $or: [],
    };

    if (employeeId) {
      query.$or.push({ employeeId: new Types.ObjectId(employeeId) });
    }
    if (departmentId) {
      query.$or.push({ departmentId: new Types.ObjectId(departmentId) });
    }
    if (positionId) {
      query.$or.push({ positionId: new Types.ObjectId(positionId) });
    }

    // Date overlap detection
    const dateOverlapQuery: any[] = [];

    if (effectiveTo) {
      dateOverlapQuery.push({
        $or: [
          {
            effectiveFrom: { $lte: new Date(effectiveFrom) },
            effectiveTo: { $gte: new Date(effectiveFrom) },
          },
          {
            effectiveFrom: { $lte: new Date(effectiveTo) },
            effectiveTo: { $gte: new Date(effectiveTo) },
          },
          {
            effectiveFrom: { $gte: new Date(effectiveFrom) },
            effectiveTo: { $lte: new Date(effectiveTo) },
          },
        ],
      });
    } else {
      dateOverlapQuery.push({
        $or: [
          { effectiveTo: null },
          { effectiveTo: { $gte: new Date(effectiveFrom) } },
        ],
      });
    }

    query.$and = dateOverlapQuery;

    if (excludeAssignmentId) {
      query._id = { $ne: new Types.ObjectId(excludeAssignmentId) };
    }

    return this.scheduleAssignmentModel.find(query).exec();
  }

  /**
   * Assign shift template to employee/department/position (single assignment)
   */
  async assign(
    createDto: CreateScheduleAssignmentDto,
  ): Promise<ScheduleAssignmentDocument> {
    // Validate assignment
    this.validateAssignment(createDto);

    // Verify shift template exists
    await this.shiftTemplateService.findById(createDto.shiftTemplateId);

    // Check for conflicts (convert string dates to Date objects)
    const conflicts = await this.detectConflicts(
      createDto.employeeId,
      createDto.departmentId,
      createDto.positionId,
      new Date(createDto.effectiveFrom),
      createDto.effectiveTo ? new Date(createDto.effectiveTo) : null,
    );

    if (conflicts.length > 0) {
      throw new ConflictException(
        `Assignment conflicts with ${conflicts.length} existing active assignment(s). Resolve conflicts before creating new assignment.`,
      );
    }

    // Create assignment
    const assignment = new this.scheduleAssignmentModel({
      shiftTemplateId: new Types.ObjectId(createDto.shiftTemplateId),
      employeeId: createDto.employeeId
        ? new Types.ObjectId(createDto.employeeId)
        : undefined,
      departmentId: createDto.departmentId
        ? new Types.ObjectId(createDto.departmentId)
        : undefined,
      positionId: createDto.positionId
        ? new Types.ObjectId(createDto.positionId)
        : undefined,
      effectiveFrom: new Date(createDto.effectiveFrom),
      effectiveTo: createDto.effectiveTo
        ? new Date(createDto.effectiveTo)
        : null,
      assignedBy: new Types.ObjectId(createDto.assignedBy),
      source: createDto.source || 'manual',
      metadata: createDto.metadata || {},
      status: 'Active',
    });

    return assignment.save();
  }

  /**
   * Bulk assign shift template to multiple employees/departments/positions
   */
  async bulkAssign(
    bulkDto: BulkAssignShiftDto,
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    // Validate bulk assignment
    const targetCount = [
      bulkDto.employeeIds?.length,
      bulkDto.departmentId,
      bulkDto.positionId,
    ].filter(Boolean).length;
    if (targetCount !== 1) {
      throw new BadRequestException(
        'Exactly one of employeeIds, departmentId, or positionId must be provided',
      );
    }

    // Verify shift template exists
    await this.shiftTemplateService.findById(bulkDto.shiftTemplateId);

    let targetEmployeeIds: string[] = [];
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    // Get target employees
    if (bulkDto.employeeIds && bulkDto.employeeIds.length > 0) {
      targetEmployeeIds = bulkDto.employeeIds;
    } else if (bulkDto.departmentId) {
      // TODO: Inject Employee model from parent module to enable department-based bulk assignment
      throw new BadRequestException(
        'Bulk assignment by department requires Employee model - not yet integrated',
      );
      // const employees = await this.employeeModel.find({ departmentId: bulkDto.departmentId }).exec();
      // targetEmployeeIds = employees.map((emp) => String(emp._id));
    } else if (bulkDto.positionId) {
      // TODO: Inject Employee model from parent module to enable position-based bulk assignment
      throw new BadRequestException(
        'Bulk assignment by position requires Employee model - not yet integrated',
      );
      // const employees = await this.employeeModel.find({ positionId: bulkDto.positionId }).exec();
      // targetEmployeeIds = employees.map((emp) => String(emp._id));
    }

    if (targetEmployeeIds.length === 0) {
      throw new BadRequestException('No employees found for bulk assignment');
    }

    // Assign to each employee
    for (const employeeId of targetEmployeeIds) {
      try {
        const createDto: CreateScheduleAssignmentDto = {
          shiftTemplateId: bulkDto.shiftTemplateId,
          employeeId,
          effectiveFrom: bulkDto.effectiveFrom,
          effectiveTo: bulkDto.effectiveTo || null,
          assignedBy: bulkDto.assignedBy,
          source: 'bulk_assignment',
          metadata: {
            reason: bulkDto.reason,
          },
        };

        await this.assign(createDto);
        success++;
      } catch (error: any) {
        failed++;
        errors.push({
          employeeId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return { success, failed, errors };
  }

  /**
   * Query schedule assignments with filters
   */
  async query(
    queryDto: QueryAssignmentsDto,
  ): Promise<ScheduleAssignmentDocument[]> {
    const query: any = {};

    if (queryDto.employeeId) {
      query.employeeId = new Types.ObjectId(queryDto.employeeId);
    }
    if (queryDto.departmentId) {
      query.departmentId = new Types.ObjectId(queryDto.departmentId);
    }
    if (queryDto.positionId) {
      query.positionId = new Types.ObjectId(queryDto.positionId);
    }
    if (queryDto.shiftTemplateId) {
      query.shiftTemplateId = new Types.ObjectId(queryDto.shiftTemplateId);
    }
    if (queryDto.status) {
      query.status = queryDto.status;
    }

    // Date range filter for calendar view
    if (queryDto.from || queryDto.to) {
      query.$or = [];
      if (queryDto.from && queryDto.to) {
        query.$or.push({
          effectiveFrom: { $lte: new Date(queryDto.to) },
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $gte: new Date(queryDto.from) } },
          ],
        });
      } else if (queryDto.from) {
        query.effectiveFrom = { $gte: new Date(queryDto.from) };
      } else if (queryDto.to) {
        query.$or = [
          { effectiveTo: null },
          { effectiveTo: { $lte: new Date(queryDto.to) } },
        ];
      }
    }

    // Populate shiftTemplateId (available in ShiftModule)
    // Note: employeeId, departmentId, positionId, assignedBy are not populated in Phase 1
    // as Employee/Department/Position models are not yet integrated
    // They will remain as ObjectIds until those models are available
    return (
      this.scheduleAssignmentModel
        .find(query)
        .populate('shiftTemplateId')
        // TODO: Uncomment when Employee/Department/Position models are integrated:
        // .populate('employeeId')
        // .populate('departmentId')
        // .populate('positionId')
        // .populate('assignedBy')
        .sort({ effectiveFrom: 1 })
        .exec()
    );
  }

  /**
   * Calculate effective schedule dates based on rotational pattern
   * Example: "4-on/3-off" means 4 days working, 3 days off
   */
  calculateRotationalSchedule(
    startDate: Date,
    endDate: Date,
    pattern: string, // e.g., "4-on/3-off"
  ): { workDays: Date[]; restDays: Date[] } {
    const workDays: Date[] = [];
    const restDays: Date[] = [];

    // Parse pattern (e.g., "4-on/3-off" -> onDays=4, offDays=3)
    const match = pattern.match(/(\d+)-on\/(\d+)-off/);
    if (!match) {
      throw new BadRequestException(
        `Invalid rotational pattern format: ${pattern}. Expected format: "X-on/Y-off"`,
      );
    }

    const onDays = parseInt(match[1], 10);
    const offDays = parseInt(match[2], 10);
    const cycleLength = onDays + offDays;

    const currentDate = new Date(startDate);
    let dayInCycle = 0;

    while (currentDate <= endDate) {
      if (dayInCycle < onDays) {
        workDays.push(new Date(currentDate));
      } else {
        restDays.push(new Date(currentDate));
      }

      dayInCycle = (dayInCycle + 1) % cycleLength;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { workDays, restDays };
  }

  /**
   * Update assignment status (Active, Inactive, Cancelled, Approved, Expired)
   */
  async updateStatus(
    id: string,
    updateDto: UpdateAssignmentStatusDto,
  ): Promise<ScheduleAssignmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assignment ID');
    }

    const assignment = await this.scheduleAssignmentModel.findById(id).exec();
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    // Update status and metadata if reason provided
    const updateData: any = { status: updateDto.status };
    if (updateDto.reason) {
      updateData.metadata = {
        ...assignment.metadata,
        reason: updateDto.reason,
        statusChangedAt: new Date(),
      };
    }

    // If status is Expired, also check if effectiveTo date has passed
    if (
      updateDto.status === 'Expired' &&
      assignment.effectiveTo &&
      new Date(assignment.effectiveTo) > new Date()
    ) {
      throw new BadRequestException(
        'Cannot mark assignment as Expired before effectiveTo date',
      );
    }

    const updatedAssignment = await this.scheduleAssignmentModel
      .findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedAssignment) {
      throw new NotFoundException(
        `Assignment with ID ${id} not found after update`,
      );
    }

    return updatedAssignment;
  }

  /**
   * Get assignment by ID
   */
  async findById(id: string): Promise<ScheduleAssignmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assignment ID');
    }
    const assignment = await this.scheduleAssignmentModel.findById(id).exec();
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }
}
