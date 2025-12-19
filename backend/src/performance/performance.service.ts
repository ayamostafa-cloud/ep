import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateAppraisalRecordDto } from './dto/create-appraisal-record.dto';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { UpdateAppraisalStatusDto } from './dto/update-appraisal-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

import {
  AppraisalTemplate,
  AppraisalTemplateDocument,
} from './models/appraisal-template.schema';

import {
  AppraisalCycle,
  AppraisalCycleDocument,
} from './models/appraisal-cycle.schema';

import {
  AppraisalRecord,
  AppraisalRecordDocument,
} from './models/appraisal-record.schema';

import {
  AppraisalDispute,
  AppraisalDisputeDocument,
} from './models/appraisal-dispute.schema';

import {
  AppraisalCycleStatus,
  AppraisalTemplateType,
  AppraisalRecordStatus,
  AppraisalDisputeStatus,
} from './enums/performance.enums';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../employee-profile/models/employee-profile.schema';
import { CreateAppraisalTemplateDto } from './dto/create-appraisal-template.dto';
@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(AppraisalTemplate.name)
    private readonly templateModel: Model<AppraisalTemplateDocument>,

    @InjectModel(AppraisalCycle.name)
    private readonly cycleModel: Model<AppraisalCycleDocument>,

    @InjectModel(AppraisalRecord.name)
    private readonly recordModel: Model<AppraisalRecordDocument>,

    @InjectModel(AppraisalDispute.name)
    private readonly disputeModel: Model<AppraisalDisputeDocument>,
    @InjectModel(EmployeeProfile.name)
  private readonly employeeModel: Model<EmployeeProfileDocument>,
) {}

  // ======================================================
  // TEMPLATES
  // ======================================================

  async createTemplate(dto: CreateAppraisalTemplateDto) {
  if (!dto.criteria || dto.criteria.length === 0) {
    throw new BadRequestException("Template must have at least one criterion");
  }

  // Map 'type' from DTO to 'templateType' for schema
  const templateData: any = { ...dto };
  if (templateData.type && !templateData.templateType) {
    templateData.templateType = templateData.type;
    delete templateData.type;
  }

  return this.templateModel.create(templateData);
}


  async getAllTemplates() {
    // Return all templates (HR can see all, managers can see all active ones)
    // Frontend will filter based on role if needed
    return this.templateModel.find().lean();
  }

  async getTemplateById(id: string) {
    const template = await this.templateModel.findById(id).lean();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(id: string, body: any) {
    const template = await this.templateModel.findById(id);
    if (!template) throw new NotFoundException('Template not found');

    // Map 'type' field from DTO to 'templateType' in schema if needed
    if (body.type && !body.templateType) {
      body.templateType = body.type;
      delete body.type;
    }

    // Remove fields that shouldn't be updated
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    // Update simple fields
    if (body.name !== undefined) template.name = body.name;
    if (body.description !== undefined) template.description = body.description;
    if (body.templateType !== undefined) template.templateType = body.templateType;
    if (body.isActive !== undefined) template.isActive = body.isActive;

    // Update nested ratingScale object properly
    if (body.ratingScale) {
      template.ratingScale = {
        ...template.ratingScale,
        ...body.ratingScale,
      };
      template.markModified('ratingScale');
    }

    // Update criteria array if provided
    if (body.criteria !== undefined) {
      template.criteria = body.criteria;
    }

    await template.save();

    // Return fresh data from database
    const updated = await this.templateModel.findById(id).lean();
    return updated;
  }

  async deleteTemplate(id: string) {
    const deleted = await this.templateModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('Template not found');
    return { message: 'Template deleted', id };
  }

  // ======================================================
  // CYCLES
  // ======================================================

  async createCycle(body: any) {
    const created = new this.cycleModel({
      ...body,
      status: AppraisalCycleStatus.PLANNED,
    });

    return created.save();
  }

  async getAllCycles() {
    return this.cycleModel.find().lean();
  }

  async getCycleById(id: string) {
    const cycle = await this.cycleModel.findById(id).lean();
    if (!cycle) throw new NotFoundException('Cycle not found');
    return cycle;
  }

  async updateCycle(id: string, body: any) {
    const cycle = await this.cycleModel.findById(id);
    if (!cycle) throw new NotFoundException('Cycle not found');

    // Prevent updates to closed or archived cycles
    if (
      cycle.status === AppraisalCycleStatus.CLOSED ||
      cycle.status === AppraisalCycleStatus.ARCHIVED
    ) {
      throw new ForbiddenException(
        'Cannot update cycle in CLOSED or ARCHIVED status. Cycles are read-only after closure.',
      );
    }

    // Prevent status changes through updateCycle - must use dedicated methods
    if (body.status && body.status !== cycle.status) {
      throw new BadRequestException(
        'Cannot change cycle status through update. Use activateCycle, closeCycle, or archiveCycle methods.',
      );
    }

    // Ensure templateAssignments departmentIds are converted to ObjectIds
    if (body.templateAssignments && Array.isArray(body.templateAssignments)) {
      body.templateAssignments = body.templateAssignments.map((ta: any) => ({
        ...ta,
        templateId: new Types.ObjectId(ta.templateId),
        departmentIds: Array.isArray(ta.departmentIds)
          ? ta.departmentIds.map((deptId: any) => new Types.ObjectId(deptId))
          : [],
      }));
    }

    Object.assign(cycle, body);
    return cycle.save();
  }

  async activateCycle(id: string) {
    const cycle = await this.cycleModel.findById(id);
    if (!cycle) throw new NotFoundException('Cycle not found');

    // Cycle can only be activated from PLANNED status
    if (cycle.status !== AppraisalCycleStatus.PLANNED) {
      throw new BadRequestException(
        `Cycle can only be activated from PLANNED status. Current status: ${cycle.status}`,
      );
    }

    cycle.status = AppraisalCycleStatus.ACTIVE;
    cycle.publishedAt = new Date();
    return cycle.save();
  }

   async closeCycle(id: string) {
    const cycle = await this.cycleModel.findById(id);
    if (!cycle) throw new NotFoundException('Cycle not found');

    // Can only close ACTIVE cycles
    if (cycle.status !== AppraisalCycleStatus.ACTIVE) {
      throw new BadRequestException(
        `Cycle can only be closed from ACTIVE status. Current status: ${cycle.status}`,
      );
    }

    // Validate all appraisals are submitted and published
    const unpublishedAppraisals = await this.recordModel.countDocuments({
      cycleId: new Types.ObjectId(id),
      status: { $ne: AppraisalRecordStatus.HR_PUBLISHED },
    });

    if (unpublishedAppraisals > 0) {
      throw new BadRequestException(
        `Cannot close cycle. ${unpublishedAppraisals} appraisal(s) are not yet published by HR.`,
      );
    }

    // Validate all disputes are resolved
    const unresolvedDisputes = await this.disputeModel.countDocuments({
      cycleId: new Types.ObjectId(id),
      status: {
        $in: [AppraisalDisputeStatus.OPEN, AppraisalDisputeStatus.UNDER_REVIEW],
      },
    });

    if (unresolvedDisputes > 0) {
      throw new BadRequestException(
        `Cannot close cycle. ${unresolvedDisputes} dispute(s) are still unresolved.`,
      );
    }

    cycle.status = AppraisalCycleStatus.CLOSED;
    cycle.closedAt = new Date();
    return cycle.save();
  }

   async archiveCycle(id: string) {
    const cycle = await this.cycleModel.findById(id);
    if (!cycle) throw new NotFoundException('Cycle not found');

    // Can only archive CLOSED cycles
    if (cycle.status !== AppraisalCycleStatus.CLOSED) {
      throw new BadRequestException(
        `Cycle can only be archived from CLOSED status. Current status: ${cycle.status}`,
      );
    }

    cycle.status = AppraisalCycleStatus.ARCHIVED;
    cycle.archivedAt = new Date();
    return cycle.save();
  }

  // ======================================================
  // APPRAISAL RECORDS
  // ======================================================

  // Manager creates appraisal record
  async createAppraisal(dto: CreateAppraisalRecordDto, managerId: string) {
    // 1) Validate cycle exists and is ACTIVE
    const cycle = await this.cycleModel.findById(dto.cycleId);
    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }
    if (cycle.status !== AppraisalCycleStatus.ACTIVE) {
      throw new BadRequestException(
        `Appraisals can only be created during ACTIVE cycles. Current cycle status: ${cycle.status}`,
      );
    }

    // 2) Validate template exists and is active
    const template = await this.templateModel.findById(dto.templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    if (!template.isActive) {
      throw new BadRequestException('Template is not active');
    }

    // 3) Find employee (support both employeeNumber and ObjectId)
    let employee;
    if (Types.ObjectId.isValid(dto.employeeProfileId)) {
      employee = await this.employeeModel.findById(dto.employeeProfileId);
    } else {
      employee = await this.employeeModel.findOne({
        employeeNumber: dto.employeeProfileId,
      });
    }

    if (!employee) {
      throw new NotFoundException(
        `Employee not found: ${dto.employeeProfileId}`,
      );
    }

    // 4) Validate manager is actually the employee's manager
    // Check if employee's supervisorPositionId matches manager's position
    const manager = await this.employeeModel.findById(managerId);
    if (!manager) {
      throw new NotFoundException('Manager profile not found');
    }

    // Verify manager relationship - employee's supervisor should be manager's position
    if (
      employee.supervisorPositionId &&
      manager.primaryPositionId &&
      employee.supervisorPositionId.toString() !==
        manager.primaryPositionId.toString()
    ) {
      throw new ForbiddenException(
        'You can only create appraisals for your direct reports',
      );
    }

    // 5) Validate employee department is assigned to cycle template assignment
    // Find the template assignment for this template in the cycle
    const templateAssignment = cycle.templateAssignments?.find(
      (ta) => {
        const taTemplateId = ta?.templateId?.toString ? ta.templateId.toString() : String(ta?.templateId);
        const dtoTemplateId = dto.templateId?.toString ? dto.templateId.toString() : String(dto.templateId);
        return taTemplateId === dtoTemplateId;
      },
    );

    if (!templateAssignment) {
      throw new ForbiddenException(
        'This template is not assigned to this appraisal cycle',
      );
    }

    // Safely extract department ID
    const employeeDeptId = employee.primaryDepartmentId?.toString();

    // Validate employee has a department assigned
    if (!employeeDeptId) {
      throw new BadRequestException(
        'Employee department not found. Employee must have a department assigned to create an appraisal.',
      );
    }

    // Handle empty departmentIds array - if empty, it means all departments are allowed
    // If departmentIds has values, only those departments are allowed
    if (
      templateAssignment.departmentIds &&
      Array.isArray(templateAssignment.departmentIds) &&
      templateAssignment.departmentIds.length > 0
    ) {
      // Check if employee's department is in the allowed departments list
      // Handle both ObjectId and string types for departmentIds
      const assignedDeptIds = templateAssignment.departmentIds.map((deptId) =>
        deptId?.toString ? deptId.toString() : String(deptId),
      );
      const isDepartmentAllowed = assignedDeptIds.includes(employeeDeptId);

      if (!isDepartmentAllowed) {
        // Debug information to help identify the issue
        throw new ForbiddenException(
          `Employee department (${employeeDeptId}) is not in the assigned departments for this template. Assigned departments: ${assignedDeptIds.join(', ') || 'none'}`,
        );
      }
    }
    // If departmentIds is empty or undefined, all departments are allowed (no restriction)

    // 6) Check for duplicate - one appraisal per employee+cycle
    const existingAppraisal = await this.recordModel.findOne({
      cycleId: new Types.ObjectId(dto.cycleId),
      employeeProfileId: employee._id,
    });

    if (existingAppraisal) {
      throw new BadRequestException(
        `Appraisal already exists for this employee in this cycle. Use updateAppraisal to modify it.`,
      );
    }

    // 7) Create appraisal record
    const record = new this.recordModel({
      cycleId: new Types.ObjectId(dto.cycleId),
      templateId: new Types.ObjectId(dto.templateId),
      employeeProfileId: employee._id,
      assignmentId: new Types.ObjectId(), // TODO: Link to actual assignment when implemented
      managerProfileId: new Types.ObjectId(managerId),
      status: AppraisalRecordStatus.DRAFT,
      ratings: dto.ratings || [],
      totalScore: dto.totalScore,
      overallRatingLabel: dto.overallRatingLabel,
      managerSummary: dto.managerSummary,
      strengths: dto.strengths,
      improvementAreas: dto.improvementAreas,
    });

    return record.save();
  }



  // Manager edits the appraisal content
  async updateAppraisal(
    id: string,
    dto: UpdateAppraisalRecordDto,
    managerId: string,
  ) {
    const record = await this.recordModel.findById(id);
    if (!record) throw new NotFoundException('Appraisal not found');

    // Validate manager ownership
    if (record.managerProfileId.toString() !== managerId) {
      throw new ForbiddenException('Not the manager of this employee');
    }

    // Validate cycle is still ACTIVE
    const cycle = await this.cycleModel.findById(record.cycleId);
    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }
    if (cycle.status !== AppraisalCycleStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot edit appraisal. Cycle is no longer ACTIVE.',
      );
    }

    // Can only edit DRAFT appraisals - once submitted, managers cannot edit
    if (record.status !== AppraisalRecordStatus.DRAFT) {
      throw new ForbiddenException(
        `Cannot edit appraisal in ${record.status} status. Only DRAFT appraisals can be edited.`,
      );
    }

    // Status changes are handled by updateAppraisalStatus method, not through updateAppraisal
    // UpdateAppraisalRecordDto doesn't include status field, so no need to check it here

    Object.assign(record, dto);
    return record.save();
  }

  // Manager submits the appraisal (MANAGER_SUBMITTED)
  async updateAppraisalStatus(
    id: string,
    dto: UpdateAppraisalStatusDto,
    managerId: string,
  ) {
    const record = await this.recordModel.findById(id);
    if (!record) throw new NotFoundException('Appraisal not found');

    // Validate manager ownership
    if (record.managerProfileId.toString() !== managerId) {
      throw new ForbiddenException('You cannot submit this appraisal');
    }

    // Validate status transition - can only submit from DRAFT
    if (record.status !== AppraisalRecordStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot submit appraisal. Current status is ${record.status}. Only DRAFT appraisals can be submitted.`,
      );
    }

    // Validate cycle is ACTIVE
    const cycle = await this.cycleModel.findById(record.cycleId);
    if (cycle && cycle.status !== AppraisalCycleStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot submit appraisal. Cycle is no longer ACTIVE.',
      );
    }

    // Managers can only set status to MANAGER_SUBMITTED
    if (dto.status !== AppraisalRecordStatus.MANAGER_SUBMITTED) {
      throw new ForbiddenException(
        'Managers can ONLY set status = MANAGER_SUBMITTED',
      );
    }

    record.status = AppraisalRecordStatus.MANAGER_SUBMITTED;
    record.managerSubmittedAt = new Date();

    return record.save();
  }

  // HR publishes the appraisal (HR_PUBLISHED)
  async publishAppraisal(
    id: string,
    hrId: string,
    dto: UpdateAppraisalStatusDto,
  ) {
    const record = await this.recordModel.findById(id);
    if (!record) throw new NotFoundException('Appraisal not found');

    // Validate status transition - can only publish from MANAGER_SUBMITTED
    if (record.status !== AppraisalRecordStatus.MANAGER_SUBMITTED) {
      throw new BadRequestException(
        `Cannot publish appraisal. Current status is ${record.status}. Only MANAGER_SUBMITTED appraisals can be published.`,
      );
    }

    // Validate HR can only set status to HR_PUBLISHED
    if (dto.status !== AppraisalRecordStatus.HR_PUBLISHED) {
      throw new ForbiddenException(
        'HR can ONLY set status = HR_PUBLISHED',
      );
    }

    // Lock appraisal and publish
    record.status = AppraisalRecordStatus.HR_PUBLISHED;
    record.hrPublishedAt = new Date();
    record.publishedByEmployeeId = new Types.ObjectId(hrId);

    return record.save();
  }

  // List all appraisals in cycle


async findCycleAppraisals(cycleId: string) {
  return this.recordModel
    .find({ cycleId: new Types.ObjectId(cycleId) })
    .populate({
      path: "employeeProfileId",
      select: "firstName lastName employeeNumber",
    })
    .lean();
}




  // Employee: list my appraisals - only published ones
  async findMyAppraisals(employeeId: string) {
    return this.recordModel
      .find({
        employeeProfileId: new Types.ObjectId(employeeId),
        status: AppraisalRecordStatus.HR_PUBLISHED, // Only show published appraisals
      })
      .populate('cycleId', 'name status')
      .populate('templateId', 'name')
      .lean();
  }




  // Employee: get one appraisal - only if published
  async findMyAppraisalById(employeeId: string, recordId: string) {
    const record = await this.recordModel
      .findOne({
        _id: new Types.ObjectId(recordId),
        employeeProfileId: new Types.ObjectId(employeeId),
        status: AppraisalRecordStatus.HR_PUBLISHED, // Only allow viewing published appraisals
      })
      .populate({
        path: 'cycleId',
        select: 'name status',
      })
      .populate({
        path: 'templateId',
        select: 'name',
      })
      .lean();

    if (!record) {
      throw new NotFoundException(
        'Appraisal not found or not yet published. Appraisals are only visible after HR publishes them.',
      );
    }

    // Track that employee viewed the appraisal
    await this.recordModel.findByIdAndUpdate(recordId, {
      employeeViewedAt: new Date(),
    });

    return record;
  }


  // Manager/HR/Admin: get one appraisal by id
  async getAppraisalById(id: string) {
    const record = await this.recordModel.findById(id).lean();
    if (!record) throw new NotFoundException('Appraisal not found');
    return record;
  }

  // Employee acknowledges appraisal
  async employeeAcknowledgeAppraisal(
    appraisalId: string,
    employeeId: string,
    comment: string,
  ) {
    const record = await this.recordModel.findById(appraisalId);
    if (!record) throw new NotFoundException('Appraisal not found');

    // Validate employee ownership
    if (record.employeeProfileId.toString() !== employeeId) {
      throw new ForbiddenException('Not your appraisal record');
    }

    // Can only acknowledge published appraisals
    if (record.status !== AppraisalRecordStatus.HR_PUBLISHED) {
      throw new BadRequestException(
        'Can only acknowledge published appraisals (HR_PUBLISHED status)',
      );
    }

    record.employeeAcknowledgedAt = new Date();
    record.employeeAcknowledgementComment = comment ?? null;

    await record.save();

    return { message: 'Acknowledgement updated', id: record._id };
  }


  // ======================================================
  // DISPUTES
  // ======================================================

 async createDispute(
  appraisalId: string,
  dto: CreateDisputeDto,
  employeeId: string,
) {
  // 1) Get the appraisal record
  const record = await this.recordModel.findById(appraisalId);
  if (!record) throw new NotFoundException('Appraisal not found');

  // 2) Make sure this employee owns this appraisal
  if (record.employeeProfileId.toString() !== employeeId) {
    throw new ForbiddenException('Not your appraisal record');
  }

  // 3) Validate appraisal is published - disputes can only be created for published appraisals
  if (record.status !== AppraisalRecordStatus.HR_PUBLISHED) {
    throw new BadRequestException(
      'Disputes can only be raised for published appraisals (HR_PUBLISHED status)',
    );
  }

  // 4) Check if dispute already exists for this appraisal
  const existingDispute = await this.disputeModel.findOne({
    appraisalId: record._id,
    raisedByEmployeeId: new Types.ObjectId(employeeId),
    status: { $in: [AppraisalDisputeStatus.OPEN, AppraisalDisputeStatus.UNDER_REVIEW] },
  });

  if (existingDispute) {
    throw new BadRequestException(
      'An active dispute already exists for this appraisal',
    );
  }

  // 5) Create dispute - routed to HR only
  const dispute = new this.disputeModel({
    appraisalId: record._id,
    assignmentId: record.assignmentId,
    cycleId: record.cycleId,
    raisedByEmployeeId: new Types.ObjectId(employeeId),
    reason: dto.reason,
    details: dto.details ?? null,
    status: AppraisalDisputeStatus.OPEN,
    submittedAt: new Date(),
  });

  return dispute.save();
}

async canRaiseDispute(appraisalId: string, employeeId: string) {
  const record = await this.recordModel.findById(appraisalId);
  if (!record) throw new NotFoundException('Appraisal not found');

  // Validate employee owns this appraisal
  if (record.employeeProfileId.toString() !== employeeId) {
    return false;
  }

  // Disputes can only be raised for published appraisals
  if (record.status !== AppraisalRecordStatus.HR_PUBLISHED) {
    return false;
  }

  // Check if active dispute already exists
  const existingDispute = await this.disputeModel.findOne({
    appraisalId: record._id,
    raisedByEmployeeId: new Types.ObjectId(employeeId),
    status: { $in: [AppraisalDisputeStatus.OPEN, AppraisalDisputeStatus.UNDER_REVIEW] },
  });

  if (existingDispute) {
    return false;
  }

  return true;
}

  async listDisputes(status?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    return this.disputeModel.find(filter).lean();
  }
 async publishCycleResults(id: string, hrId?: string) {
  const cycle = await this.cycleModel.findById(id);
  if (!cycle) throw new NotFoundException('Cycle not found');

  // Find all MANAGER_SUBMITTED appraisals in this cycle
  const submittedAppraisals = await this.recordModel.find({
    cycleId: new Types.ObjectId(id),
    status: AppraisalRecordStatus.MANAGER_SUBMITTED,
  });

  if (submittedAppraisals.length === 0) {
    throw new BadRequestException(
      'No submitted appraisals found to publish. Managers must submit appraisals before HR can publish results.',
    );
  }

  // Publish all submitted appraisals
  const now = new Date();
  const hrObjectId = hrId ? new Types.ObjectId(hrId) : undefined;
  
  await this.recordModel.updateMany(
    {
      cycleId: new Types.ObjectId(id),
      status: AppraisalRecordStatus.MANAGER_SUBMITTED,
    },
    {
      $set: {
        status: AppraisalRecordStatus.HR_PUBLISHED,
        hrPublishedAt: now,
        ...(hrObjectId && { publishedByEmployeeId: hrObjectId }),
      },
    },
  );

  // Update cycle published date (but don't close it - closing is separate)
  cycle.publishedAt = now;
  await cycle.save();

  return {
    message: `Published ${submittedAppraisals.length} appraisal(s)`,
    publishedCount: submittedAppraisals.length,
  };
}

async deleteDispute(id: string) {
  const dispute = await this.disputeModel.findById(id);
  if (!dispute) throw new NotFoundException('Dispute not found');

  // Only allow deletion of OPEN disputes (before HR review)
  // Once reviewed, disputes should be resolved, not deleted
  if (dispute.status !== AppraisalDisputeStatus.OPEN) {
    throw new ForbiddenException(
      'Cannot delete dispute. Only OPEN disputes can be deleted. Resolved disputes must be kept for audit.',
    );
  }

  await this.disputeModel.findByIdAndDelete(id);
  return { message: 'Dispute deleted', id };
}

  async resolveDispute(
  id: string,
  dto: ResolveDisputeDto,
  hrId: string,
) {
  const dispute = await this.disputeModel.findById(id);
  if (!dispute) throw new NotFoundException('Dispute not found');

  // Validate status transition - can only resolve OPEN or UNDER_REVIEW disputes
  if (
    dispute.status !== AppraisalDisputeStatus.OPEN &&
    dispute.status !== AppraisalDisputeStatus.UNDER_REVIEW
  ) {
    throw new BadRequestException(
      `Cannot resolve dispute in ${dispute.status} status. Only OPEN or UNDER_REVIEW disputes can be resolved.`,
    );
  }

  // Validate new status - HR can either ADJUST (uphold with changes) or REJECT (uphold original)
  if (
    dto.newStatus !== AppraisalDisputeStatus.ADJUSTED &&
    dto.newStatus !== AppraisalDisputeStatus.REJECTED
  ) {
    throw new BadRequestException(
      'HR can only resolve disputes as ADJUSTED (with rating changes) or REJECTED (uphold original appraisal)',
    );
  }

  // Require resolution summary - every decision must be logged
  if (!dto.resolutionSummary || dto.resolutionSummary.trim().length === 0) {
    throw new BadRequestException(
      'Resolution summary is required. Every dispute decision must be logged.',
    );
  }

  // Update dispute status and resolution details
  dispute.status = dto.newStatus;
  dispute.resolutionSummary = dto.resolutionSummary;
  dispute.resolvedAt = new Date();
  dispute.resolvedByEmployeeId = new Types.ObjectId(hrId);

  // If ADJUSTED, update the appraisal record with new ratings
  if (dto.newStatus === AppraisalDisputeStatus.ADJUSTED) {
    const appraisal = await this.recordModel.findById(dispute.appraisalId);
    if (!appraisal) {
      throw new NotFoundException(
        'Appraisal record not found for this dispute',
      );
    }

    // Update appraisal with adjusted ratings if provided
    if (dto.updatedTotalScore !== undefined) {
      appraisal.totalScore = dto.updatedTotalScore;
    }
    if (dto.updatedOverallRatingLabel !== undefined) {
      appraisal.overallRatingLabel = dto.updatedOverallRatingLabel;
    }

    await appraisal.save();
  }

  return dispute.save();
}
async getDisputeById(id: string) {
  const dispute = await this.disputeModel
    .findById(id)
    .populate('appraisalId')
    .populate('raisedByEmployeeId', 'firstName lastName employeeNumber')
    .populate('resolvedByEmployeeId', 'firstName lastName employeeNumber')
    .lean();

  if (!dispute) {
    throw new NotFoundException('Dispute not found');
  }

  return dispute;
}



}