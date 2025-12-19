import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// models (singular)
import { LeaveType, LeaveTypeDocument } from './models/leave-type.schema';
import { LeaveCategory } from './models/leave-category.schema';
import { LeavePolicy, LeavePolicyDocument } from './models/leave-policy.schema';
import { LeaveRequest, LeaveRequestDocument } from './models/leave-request.schema';
import { Attachment } from './models/attachment.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from './models/leave-entitlement.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from './models/leave-adjustment.schema';
import { Calendar, CalendarDocument } from './models/calendar.schema';

// DTOs
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { CreateLeaveEntitlementDto } from './dto/create-leave-entitlement.dto';
import { UpdateLeaveEntitlementDto } from './dto/update-leave-entitlement.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ApproveAdjustmentDto } from './dto/approve-adjustment.dto';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { CreateBlockedPeriodDto } from './dto/create-blocked-period.dto';

// enums
import { LeaveStatus } from './enums/leave-status.enum';
import { AdjustmentType } from './enums/adjustment-type.enum';

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(LeaveType.name)
    private leaveTypeModel: Model<LeaveTypeDocument>,

    @InjectModel(LeaveCategory.name)
    private leaveCategoryModel: Model<LeaveCategory>,

    @InjectModel(LeavePolicy.name)
    private leavePolicyModel: Model<LeavePolicyDocument>,

    @InjectModel(LeaveRequest.name)
    private requestModel: Model<LeaveRequestDocument>,

    @InjectModel(Attachment.name)
    private attachmentModel: Model<Attachment>,

    @InjectModel(LeaveEntitlement.name)
    private entitlementModel: Model<LeaveEntitlementDocument>,

    @InjectModel(LeaveAdjustment.name)
    private adjustmentModel: Model<LeaveAdjustmentDocument>,

    @InjectModel(Calendar.name)
    private calendarModel: Model<CalendarDocument>,
  ) {}

  // ============================================================
  // LEAVE TYPE
  // ============================================================
  leaveType = {
    create: async (dto: CreateLeaveTypeDto) => {
      const exists = await this.leaveTypeModel.findOne({ code: dto.code }).exec();
      if (exists) throw new ConflictException(`Leave type with code '${dto.code}' already exists`);
      return new this.leaveTypeModel(dto).save();
    },

    findAll: async () => this.leaveTypeModel.find().exec(),

    findActive: async () => this.leaveTypeModel.find({ isActive: true }).exec(),

    findOne: async (id: string) => {
      const doc = await this.leaveTypeModel.findById(id).exec();
      if (!doc) throw new NotFoundException(`Leave type with ID '${id}' not found`);
      return doc;
    },

    findByCode: async (code: string) => {
      const doc = await this.leaveTypeModel.findOne({ code }).exec();
      if (!doc) throw new NotFoundException(`Leave type with code '${code}' not found`);
      return doc;
    },

    update: async (id: string, dto: UpdateLeaveTypeDto) => {
      if ((dto as any).code) {
        const exists = await this.leaveTypeModel
          .findOne({ code: (dto as any).code, _id: { $ne: id } })
          .exec();
        if (exists)
          throw new ConflictException(`Leave type with code '${(dto as any).code}' already exists`);
      }

      const updated = await this.leaveTypeModel.findByIdAndUpdate(id, dto, { new: true }).exec();
      if (!updated) throw new NotFoundException(`Leave type with ID '${id}' not found`);
      return updated;
    },

    remove: async (id: string) => {
      const result = await this.leaveTypeModel.findByIdAndDelete(id).exec();
      if (!result) throw new NotFoundException(`Leave type with ID '${id}' not found`);
    },
  };

  // ============================================================
  // LEAVE POLICY
  // ============================================================
  leavePolicy = {
    create: async (dto: CreatePolicyDto) => {
      const doc = new this.leavePolicyModel({
        ...dto,
        leaveTypeId: dto.leaveTypeId ? new Types.ObjectId(dto.leaveTypeId) : undefined,
      });
      return doc.save();
    },

    findAll: async () => this.leavePolicyModel.find().exec(),

    findActive: async () => {
      const now = new Date();
      return this.leavePolicyModel
        .find({
          isActive: true,
          $or: [
            { effectiveFrom: { $lte: now }, effectiveTo: { $gte: now } },
            { effectiveFrom: { $lte: now }, effectiveTo: null },
            { effectiveFrom: null, effectiveTo: null },
          ],
        })
        .exec();
    },

    findByType: async (policyType: string) =>
      this.leavePolicyModel.find({ policyType, isActive: true }).exec(),

    findOne: async (id: string) => {
      const doc = await this.leavePolicyModel.findById(id).exec();
      if (!doc) throw new NotFoundException(`Policy with ID '${id}' not found`);
      return doc;
    },

    update: async (id: string, dto: UpdatePolicyDto) => {
      const updated = await this.leavePolicyModel.findByIdAndUpdate(id, dto, { new: true }).exec();
      if (!updated) throw new NotFoundException(`Policy with ID '${id}' not found`);
      return updated;
    },

    remove: async (id: string) => {
      const deleted = await this.leavePolicyModel.findByIdAndDelete(id).exec();
      if (!deleted) throw new NotFoundException(`Policy with ID '${id}' not found`);
    },
  };

  // ============================================================
  // LEAVE REQUEST
  // ============================================================
  leaveRequest = {
    create: async (dto: CreateLeaveRequestDto) => {
      const from = new Date(dto.startDate);
      const to = new Date(dto.endDate);

      if (from > to) throw new BadRequestException('startDate must be <= endDate');

      const durationDays = (to.getTime() - from.getTime()) / 86400000 + 1;

      const doc = new this.requestModel({
        employeeId: new Types.ObjectId(dto.employeeId),
        leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
        dates: { from, to },
        durationDays,
        justification: dto.justification,
        attachmentId: dto.attachmentId ? new Types.ObjectId(dto.attachmentId) : undefined,
        approvalFlow: [],
        status: LeaveStatus.PENDING,
        irregularPatternFlag: false,
      });

      return doc.save();
    },

    findAll: async () => this.requestModel.find().lean(),

    findByEmployee: async (employeeId: string) =>
      this.requestModel
        .find({ employeeId: new Types.ObjectId(employeeId) })
        .sort({ createdAt: -1 })
        .lean(),

    findOne: async (id: string) => {
      const doc = await this.requestModel.findById(id).exec();
      if (!doc) throw new NotFoundException('Leave request not found');
      return doc;
    },

    update: async (id: string, dto: UpdateLeaveRequestDto) => {
      const updatePayload: any = {};

      if ((dto as any).startDate) updatePayload['dates.from'] = new Date((dto as any).startDate);
      if ((dto as any).endDate) updatePayload['dates.to'] = new Date((dto as any).endDate);

      if ((dto as any).startDate && (dto as any).endDate) {
        const f = new Date((dto as any).startDate);
        const t = new Date((dto as any).endDate);
        if (f > t) throw new BadRequestException('startDate must be <= endDate');
      }

      if ((dto as any).justification) updatePayload.justification = (dto as any).justification;

      if ((dto as any).attachmentId)
        updatePayload.attachmentId = new Types.ObjectId((dto as any).attachmentId);

      const doc = await this.requestModel
        .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
        .exec();

      if (!doc) throw new NotFoundException('Leave request not found');
      return doc;
    },

    cancel: async (id: string, requestedById?: string) => {
      const doc = await this.requestModel.findById(id).exec();
      if (!doc) throw new NotFoundException('Leave request not found');

      doc.status = LeaveStatus.CANCELLED;
      doc.approvalFlow.push({
        role: 'system',
        status: 'cancelled',
        decidedBy: requestedById ? new Types.ObjectId(requestedById) : undefined,
        decidedAt: new Date(),
      });

      return doc.save();
    },

    managerApprove: async (id: string, managerId: string) => {
      const doc = await this.requestModel.findById(id).exec();
      if (!doc) throw new NotFoundException('Leave request not found');

      if (doc.status !== LeaveStatus.PENDING)
        throw new BadRequestException('Request is not pending');

      doc.status = LeaveStatus.APPROVED;
      doc.approvalFlow.push({
        role: 'manager',
        status: 'approved',
        decidedBy: new Types.ObjectId(managerId),
        decidedAt: new Date(),
      });

      return doc.save();
    },

    managerReject: async (id: string, managerId: string, reason?: string) => {
      const doc = await this.requestModel.findById(id).exec();
      if (!doc) throw new NotFoundException('Leave request not found');

      doc.status = LeaveStatus.REJECTED;
      doc.approvalFlow.push({
        role: 'manager',
        status: reason ?? 'rejected',
        decidedBy: new Types.ObjectId(managerId),
        decidedAt: new Date(),
      });

      return doc.save();
    },
  };

  // ============================================================
  // LEAVE ENTITLEMENT
  // ============================================================
  leaveEntitlement = {
    create: async (dto: CreateLeaveEntitlementDto) => {
      const exists = await this.entitlementModel.findOne({
        employeeId: new Types.ObjectId(dto.employeeId),
        leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
        year: dto.year,
      });

      if (exists) throw new BadRequestException('Entitlement already exists.');

      const doc = new this.entitlementModel({
        employeeId: new Types.ObjectId(dto.employeeId),
        leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
        yearlyEntitlement: dto.totalDays,
        carryForward: dto.carriedOverDays || 0,
        taken: 0,
        pending: 0,
        remaining: dto.totalDays + (dto.carriedOverDays || 0),
        accruedActual: 0,
        accruedRounded: 0,
      });

      return doc.save();
    },

    findAll: async () =>
      this.entitlementModel.find().populate('leaveTypeId').lean(),

    findByEmployee: async (employeeId: string) =>
      this.entitlementModel
        .find({ employeeId: new Types.ObjectId(employeeId) })
        .populate('leaveTypeId')
        .lean(),

    update: async (employeeId: string, dto: UpdateLeaveEntitlementDto) => {
      const doc = await this.entitlementModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId((dto as any).leaveTypeId),
      });

      if (!doc) throw new NotFoundException('Entitlement not found');

      if ((dto as any).totalDays !== undefined) doc.yearlyEntitlement = (dto as any).totalDays;
      if ((dto as any).usedDays !== undefined) doc.taken = (dto as any).usedDays;
      if ((dto as any).pendingDays !== undefined) doc.pending = (dto as any).pendingDays;

      doc.remaining = doc.yearlyEntitlement + doc.carryForward - doc.taken - doc.pending;

      return doc.save();
    },

    adjustBalance: async (employeeId: string, leaveTypeId: string, deltaDays: number) => {
      const doc = await this.entitlementModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
      });

      if (!doc) throw new NotFoundException('Entitlement not found');

      doc.taken += deltaDays;
      doc.remaining = doc.yearlyEntitlement + doc.carryForward - doc.taken - doc.pending;

      if (doc.remaining < 0)
        throw new BadRequestException('Insufficient leave balance');

      return doc.save();
    },

    removeByEmployee: async (employeeId: string) =>
      this.entitlementModel.deleteMany({ employeeId: new Types.ObjectId(employeeId) }).exec(),
  };

  // ============================================================
  // LEAVE ADJUSTMENT
  // ============================================================
  leaveAdjustment = {
    create: async (dto: CreateAdjustmentDto) => {
      const doc = new this.adjustmentModel({
        employeeId: new Types.ObjectId(dto.employeeId),
        leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
        adjustmentType: dto.adjustmentType as AdjustmentType,
        amount: dto.amount,
        reason: dto.reason,
        hrUserId: new Types.ObjectId(dto.hrUserId),
      });

      return doc.save();
    },

    findAll: async () => this.adjustmentModel.find().lean(),

    findById: async (id: string) => {
      const doc = await this.adjustmentModel.findById(id).exec();
      if (!doc) throw new NotFoundException('Adjustment not found');
      return doc;
    },

    approve: async (id: string, dto: ApproveAdjustmentDto) => {
      const doc = await this.adjustmentModel.findById(id).exec();
      if (!doc) throw new NotFoundException('Adjustment not found');

      const delta =
        doc.adjustmentType === AdjustmentType.ADD ? doc.amount : -doc.amount;

      await this.leaveEntitlement.adjustBalance(
        doc.employeeId.toString(),
        doc.leaveTypeId.toString(),
        delta,
      );

      doc.hrUserId = new Types.ObjectId(dto.approverId);
      return doc.save();
    },
  };

  // ============================================================
  // CALENDAR
  // ============================================================
  calendar = {
    create: async (dto: CreateCalendarDto) => {
      const exists = await this.calendarModel.findOne({ year: dto.year }).exec();
      if (exists) throw new ConflictException(`Calendar for year ${dto.year} already exists`);
      return new this.calendarModel(dto).save();
    },

    findAll: async () => this.calendarModel.find().exec(),

    findByYear: async (year: number) => {
      const doc = await this.calendarModel.findOne({ year }).exec();
      if (!doc) throw new NotFoundException(`Calendar for year ${year} not found`);
      return doc;
    },

    update: async (year: number, dto: UpdateCalendarDto) => {
      const doc = await this.calendarModel.findOneAndUpdate({ year }, dto, { new: true }).exec();
      if (!doc) throw new NotFoundException(`Calendar for year ${year} not found`);
      return doc;
    },

    remove: async (year: number) => {
      const result = await this.calendarModel.findOneAndDelete({ year }).exec();
      if (!result) throw new NotFoundException(`Calendar for year ${year} not found`);
    },

    addBlockedPeriod: async (year: number, dto: CreateBlockedPeriodDto) => {
      const cal = await this.calendarModel.findOne({ year }).exec();
      if (!cal) throw new NotFoundException(`Calendar for year ${year} not found`);

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);

      if (start > end)
        throw new BadRequestException('Start date must be before end date');

      cal.blockedPeriods.push({
        from: start,
        to: end,
        reason: dto.reason,
      });

      return cal.save();
    },

    removeBlockedPeriod: async (year: number, index: number) => {
      const cal = await this.calendarModel.findOne({ year }).exec();
      if (!cal) throw new NotFoundException(`Calendar for year ${year} not found`);

      if (index < 0 || index >= cal.blockedPeriods.length)
        throw new BadRequestException('Invalid blocked period index');

      cal.blockedPeriods.splice(index, 1);
      return cal.save();
    },
  };
}
