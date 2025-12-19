import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimePolicy, TimePolicyDocument, PolicyScope } from '../schemas/time-policy.schema';

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(TimePolicy.name) private policyModel: Model<TimePolicyDocument>,
  ) {}

  async create(policyData: Partial<TimePolicy>): Promise<TimePolicyDocument> {
    // Validate scope requirements
    if (policyData.scope === PolicyScope.DEPARTMENT && !policyData.departmentId) {
      throw new BadRequestException('Department ID is required for DEPARTMENT scope');
    }
    if (policyData.scope === PolicyScope.EMPLOYEE && !policyData.employeeId) {
      throw new BadRequestException('Employee ID is required for EMPLOYEE scope');
    }

    const policy = new this.policyModel(policyData);
    return policy.save();
  }

  async findAll(filters?: {
    scope?: PolicyScope;
    active?: boolean;
    departmentId?: Types.ObjectId;
    employeeId?: Types.ObjectId;
  }): Promise<TimePolicyDocument[]> {
    const query: any = {};

    if (filters?.scope) {
      query.scope = filters.scope;
    }
    if (filters?.active !== undefined) {
      query.active = filters.active;
    }
    if (filters?.departmentId) {
      query.departmentId = filters.departmentId;
    }
    if (filters?.employeeId) {
      query.employeeId = filters.employeeId;
    }

    return this.policyModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: Types.ObjectId): Promise<TimePolicyDocument> {
    const policy = await this.policyModel.findById(id);
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }
    return policy;
  }

  async update(id: Types.ObjectId, updateData: Partial<TimePolicy>): Promise<TimePolicyDocument> {
    const policy = await this.findById(id);
    
    // Validate scope requirements if scope is being changed
    if (updateData.scope === PolicyScope.DEPARTMENT && !updateData.departmentId && !policy.departmentId) {
      throw new BadRequestException('Department ID is required for DEPARTMENT scope');
    }
    if (updateData.scope === PolicyScope.EMPLOYEE && !updateData.employeeId && !policy.employeeId) {
      throw new BadRequestException('Employee ID is required for EMPLOYEE scope');
    }

    Object.assign(policy, updateData);
    return policy.save();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const policy = await this.findById(id);
    await policy.deleteOne();
  }

  async assignToEmployee(policyId: Types.ObjectId, employeeId: Types.ObjectId): Promise<TimePolicyDocument> {
    const policy = await this.findById(policyId);
    
    // Create employee-specific policy copy
    const employeePolicy = new this.policyModel({
      ...policy.toObject(),
      _id: undefined,
      scope: PolicyScope.EMPLOYEE,
      employeeId,
    });
    
    return employeePolicy.save();
  }

  async assignToDepartment(policyId: Types.ObjectId, departmentId: Types.ObjectId): Promise<TimePolicyDocument> {
    const policy = await this.findById(policyId);
    
    // Create department-specific policy copy
    const departmentPolicy = new this.policyModel({
      ...policy.toObject(),
      _id: undefined,
      scope: PolicyScope.DEPARTMENT,
      departmentId,
    });
    
    return departmentPolicy.save();
  }
}

