import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department } from '../models/department.schema';
import { Position } from '../models/position.schema';

@Injectable()
export class StructureValidation {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,

    @InjectModel(Position.name)
    private readonly positionModel: Model<Position>,
  ) {}

  // 1️⃣ Validate Mongo ID
  validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID: ${id}`);
    }
  }

  // 2️⃣ Validate department exists
  async validateDepartmentExists(deptId: string) {
    this.validateObjectId(deptId);
    const dept = await this.departmentModel.findById(deptId);
    if (!dept) throw new NotFoundException(`Department not found: ${deptId}`);
    return dept;
  }

  // 3️⃣ Validate department is active
  async validateDepartmentActive(deptId: string) {
    const dept = await this.validateDepartmentExists(deptId);
    if (!dept.isActive) {
      throw new BadRequestException(`Department is not active: ${deptId}`);
    }
    return dept;
  }

  // 4️⃣ Validate position exists
  async validatePositionExists(positionId: string) {
    this.validateObjectId(positionId);
    const pos = await this.positionModel.findById(positionId);
    if (!pos) throw new NotFoundException(`Position not found: ${positionId}`);
    return pos;
  }

  // 5️⃣ Validate position is active
  async validatePositionActive(positionId: string) {
    const pos = await this.validatePositionExists(positionId);
    // Support different shape possibilities: `status: 'active'` or `isActive: boolean`
    const statusVal = (pos as any).status;
    const isActiveFlag = (pos as any).isActive;
    const isActive =
      (typeof statusVal !== 'undefined' ? String(statusVal) === 'active' : undefined) ??
      (typeof isActiveFlag !== 'undefined' ? Boolean(isActiveFlag) : false);

    if (!isActive) {
      throw new BadRequestException(`Position is not active: ${positionId}`);
    }
    return pos;
  }

  // 6️⃣ Validate reportingTo
  async validateReportingTo(reportingToId: string) {
    if (!reportingToId) return null; // optional
    const manager = await this.validatePositionActive(reportingToId);
    return manager;
  }

  // 7️⃣ Check for circular reporting (A → B → C → A)
  async checkCircularHierarchy(childId: string, parentId: string) {
    if (!parentId) return;

    let current = await this.positionModel.findById(parentId).lean();

    while (current) {
      const reportsTo = (current as any).reportsToPositionId ?? (current as any).reportingTo;
      if (reportsTo && String(reportsTo) === childId) {
        throw new BadRequestException(
          `Circular reporting detected: position ${childId} cannot report to ${parentId}`
        );
      }
      if (!reportsTo) break;
      current = await this.positionModel.findById(reportsTo).lean();
    }
  }
}
