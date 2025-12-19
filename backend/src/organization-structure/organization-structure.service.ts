import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { StructureValidation } from './utils/structure.validation';
import { Model } from 'mongoose';
import {  NotFoundException } from '@nestjs/common';
import { Department, DepartmentDocument } from './models/department.schema';
import { Position, PositionDocument } from './models/position.schema';
import { BadRequestException,} from '@nestjs/common';
import { SetReportingLineDto } from './dto/set-reporting-line.dto';
import { Types } from 'mongoose';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
@Injectable()
export class OrganizationStructureService {
  constructor(
    @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
    @InjectModel(Position.name) private readonly positionModel: Model<Position>,
    private readonly validation: StructureValidation        // <-- NEW 
  ) {}
  // -----------------------------------------
  // POSITIONS — TEST MODE (NO HOOKS)
  // -----------------------------------------
  // This avoids MissingSchemaError because schema pre-save hooks are skipped.

  async createPosition(dto: CreatePositionDto) {
    // Validate department exists
    const department = await this.departmentModel.findById(dto.departmentId);

    if (!department) {
      throw new NotFoundException('Department does not exist');
    }

    // DIRECT INSERT → skip hooks safely
    const inserted = await this.positionModel.collection.insertOne({
      ...dto,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      _id: inserted.insertedId,
      code: dto.code,
      title: dto.title,
      description: dto.description ?? null,
      departmentId: dto.departmentId,
      isActive: true,
    };
  }

  // GET ALL POSITIONS
  async getPositions() {
    return this.positionModel.find().exec();
  }

  // GET ONE POSITION
  async getPositionById(id: string) {
    const pos = await this.positionModel.findById(id).exec();

    if (!pos) {
      throw new NotFoundException('Position not found');
    }

    return pos;
  }

  // UPDATE POSITION (this uses update → hook may run but your schema's update hook is safe)
  async updatePosition(id: string, dto: UpdatePositionDto) {
    const updated = await this.positionModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Position not found');
    }

    return updated;
  }

  // DEACTIVATE POSITION
  async deactivatePosition(id: string) {
    const pos = await this.positionModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!pos) {
      throw new NotFoundException('Position not found');
    }

    return pos;
  }
    // CREATE
  async createDepartment(dto: CreateDepartmentDto) {
    const exists = await this.departmentModel.findOne({ code: dto.code });
    if (exists) {
      throw new BadRequestException('Department code must be unique');
    }

    const department = new this.departmentModel(dto);
    return department.save();
  }

  // GET ALL
  async getAllDepartments() {
    return this.departmentModel.find();
  }

  // GET ONE
  async getDepartmentById(id: string) {
    const dep = await this.departmentModel.findById(id);
    if (!dep) {
      throw new NotFoundException('Department not found');
    }
    return dep;
  }

  // UPDATE
  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const updated = await this.departmentModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Department not found');
    }
    return updated;
  }

  // DEACTIVATE
  async deactivateDepartment(id: string) {
    const dep = await this.departmentModel.findById(id);
    if (!dep) {
      throw new NotFoundException('Department not found');
    }

    dep.isActive = false;
    return dep.save();
  }
  ///report line 
 async setReportingLine(positionId: string, reportsToId: string) {
  const position = await this.positionModel.findById(positionId);
  if (!position) throw new NotFoundException('Position not found');

  const manager = await this.positionModel.findById(reportsToId);
  if (!manager) throw new NotFoundException('Manager position not found');

  await this.positionModel.collection.updateOne(
    { _id: new Types.ObjectId(positionId) },
    {
      $set: {
        reportsToPositionId: new Types.ObjectId(reportsToId),
        updatedAt: new Date(),
      },
    }
  );

  return {
    message: "Reporting line set successfully",
    positionId,
    reportsToId,
  };
}


async removeReportingLine(positionId: string) {
  const position = await this.positionModel.findById(positionId);
  if (!position) throw new NotFoundException('Position not found');

  await this.positionModel.collection.updateOne(
    { _id: new Types.ObjectId(positionId) },
    {
      $unset: { reportsToPositionId: "" },
      $set: { updatedAt: new Date() },
    }
  );

  return {
    message: "Reporting line removed",
    positionId,
  };
}
async getManagerOfPosition(id: string) {
  const position = await this.positionModel.findById(id);
  if (!position) {
    throw new NotFoundException('Position not found');
  }

  if (!position.reportsToPositionId) {
    return { manager: null };
  }

  const manager = await this.positionModel.findById(position.reportsToPositionId);
  return { manager };
}
async getPositionsInDepartment(departmentId: string) {
  const dep = await this.departmentModel.findById(departmentId);

  if (!dep) {
    throw new NotFoundException('Department not found');
  }

  return this.positionModel.find({ departmentId }).exec();
}
async validateDepartment(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return { valid: false, reason: 'Invalid ObjectId format' };
  }

  const department = await this.departmentModel.findById(id);

  if (!department) {
    return { valid: false, reason: 'Department does not exist' };
  }

  if (!department.isActive) {
    return { valid: false, reason: 'Department is inactive' };
  }

  return { valid: true, department };
}

async validatePosition(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return { valid: false, reason: 'Invalid ObjectId format' };
  }

  const position = await this.positionModel.findById(id);

  if (!position) {
    return { valid: false, reason: 'Position does not exist' };
  }

  if (!position.isActive) {
    return { valid: false, reason: 'Position is inactive' };
  }

  return { valid: true, position };
}
async validateReportingLine(sourceId: string, targetId: string) {
  // Validate ObjectIds
  if (!Types.ObjectId.isValid(sourceId)) {
    return { valid: false, reason: 'Invalid source position ObjectId' };
  }
  if (!Types.ObjectId.isValid(targetId)) {
    return { valid: false, reason: 'Invalid target (manager) ObjectId' };
  }

  // Find source & target
  const source = await this.positionModel.findById(sourceId);
  const target = await this.positionModel.findById(targetId);

  if (!source) return { valid: false, reason: 'Source position does not exist' };
  if (!target) return { valid: false, reason: 'Target (manager) position does not exist' };

  // Must be active
  if (!source.isActive) return { valid: false, reason: 'Source position is inactive' };
  if (!target.isActive) return { valid: false, reason: 'Manager position is inactive' };

  // Must be same department
  if (String(source.departmentId) !== String(target.departmentId)) {
    return { valid: false, reason: 'Positions must belong to the same department' };
  }

  // Prevent reporting-to self
  if (sourceId === targetId) {
    return { valid: false, reason: 'A position cannot report to itself' };
  }

  // ❗ Prevent circular loops
  let current = await this.positionModel.findById(target.reportsToPositionId);

  while (current) {
    if (String(current._id) === String(sourceId)) {
      return {
        valid: false,
        reason: 'Circular reporting detected (loop)',
      };
    }
    current = await this.positionModel.findById(current.reportsToPositionId);
  }

  return { valid: true, message: 'Reporting line is valid' };
}

async activateDepartment(id: string) {
  const dep = await this.departmentModel.findById(id);
  if (!dep) {
    throw new NotFoundException('Department not found');
  }

  dep.isActive = true;
  return dep.save();
}

async activatePosition(id: string) {
  // 1. Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid position ID');
  }

  // 2. Check position exists
  const pos = await this.positionModel.findById(id);
  if (!pos) {
    throw new NotFoundException('Position not found');
  }

  // 3. Bypass mongoose hooks → direct update
  await this.positionModel.collection.updateOne(
    { _id: new Types.ObjectId(id) },
    {
      $set: {
        isActive: true,
        updatedAt: new Date(),
      },
    },
  );

  // 4. Return updated object
  return {
    message: 'Position activated successfully',
    _id: pos._id,
    code: pos.code,
    title: pos.title,
    isActive: true,
  };
}


}

