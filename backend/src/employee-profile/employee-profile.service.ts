import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from './models/employee-profile.schema';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SelfUpdateDto } from './dto/self-update.dto';

import { EmployeeProfileChangeRequest } from './models/ep-change-request.schema';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';

import { ProfileChangeStatus } from './enums/employee-profile.enums';
import { EmployeeStatus } from './enums/employee-profile.enums';
import { SystemRole } from './enums/employee-profile.enums';

import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

import {
  EmployeeSystemRole,
  EmployeeSystemRoleDocument,
} from './models/employee-system-role.schema';

import { CreateManagerDto } from './dto/create-manager.dto';

@Injectable()
export class EmployeeProfileService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,

    @InjectModel(EmployeeSystemRole.name)
    private readonly employeeSystemRoleModel: Model<EmployeeSystemRole>,
  @InjectModel(EmployeeSystemRole.name)
    private readonly roleModel: Model<EmployeeSystemRoleDocument>,
    @InjectModel(EmployeeProfileChangeRequest.name)
    private readonly changeRequestModel: Model<EmployeeProfileChangeRequest>,
  ) {}

  async findByEmployeeId(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employeeId');
    }

    const doc = await this.roleModel.findOne({ employeeProfileId: employeeId }).lean();
    if (!doc) throw new NotFoundException('Role document not found');

    // returns: { _id, employeeProfileId, roles:[...] ... }
    return doc;
  }

  async updateRoles(employeeId: string, dto: UpdateEmployeeDto) {
    return this.roleModel.findOneAndUpdate(
      { employeeProfileId: new Types.ObjectId(employeeId) },
      { roles: dto.roles },
      { new: true, upsert: true }, // 🔥 important
    );
  }

  async create(createDto: CreateEmployeeDto) {
    if (createDto.password) {
      const salt = await bcrypt.genSalt(10);
      createDto.password = await bcrypt.hash(createDto.password, salt);
    }

    const role: SystemRole =
      createDto.role &&
      Object.values(SystemRole).includes(createDto.role as SystemRole)
        ? (createDto.role as SystemRole)
        : SystemRole.DEPARTMENT_EMPLOYEE;

    const employee = await this.employeeModel.create({
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      nationalId: createDto.nationalId,
      password: createDto.password,
      employeeNumber: createDto.employeeNumber,
      dateOfHire: new Date(createDto.dateOfHire),
      primaryDepartmentId: createDto.primaryDepartmentId,
      primaryPositionId: createDto.primaryPositionId,
      workEmail: createDto.workEmail,
      biography: createDto.biography,
      contractType: createDto.contractType,
      workType: createDto.workType,
      status: createDto.status,
      address: createDto.address,
    });

    await this.employeeSystemRoleModel.create({
      employeeProfileId: employee._id,
      roles: [role],
      isActive: true,
    });

    return employee;
  }

  async findAll(
  page: number,
  limit: number,
  role?: SystemRole,
) {
  const skip = (page - 1) * limit;

  // ===============================
  // 1️⃣ FILTER BY ROLE (OPTIONAL)
  // ===============================
  let employeeFilter: any = {};

  if (role) {
    const roleDocs = await this.employeeSystemRoleModel
      .find({ roles: role, isActive: true })
      .lean();

    const employeeIds = roleDocs.map(r => r.employeeProfileId);

    if (employeeIds.length === 0) {
      return { items: [], total: 0 };
    }

    employeeFilter = { _id: { $in: employeeIds } };
  }

  // ===============================
  // 2️⃣ LOAD EMPLOYEES
  // ===============================
  const employees = await this.employeeModel
    .find(employeeFilter)
    .populate("primaryDepartmentId", "name")
    .populate("primaryPositionId", "title name")
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.employeeModel.countDocuments(employeeFilter);

  // ===============================
  // 3️⃣ LOAD ROLES
  // ===============================
  const employeeIds = employees.map(e => e._id);

  const rolesDocs = await this.employeeSystemRoleModel
    .find({
      employeeProfileId: { $in: employeeIds },
      isActive: true,
    })
    .lean();

  // Map employeeId → role
  const roleMap = new Map<string, string>();
  rolesDocs.forEach(r => {
    roleMap.set(r.employeeProfileId.toString(), r.roles[0]);
  });

  // ===============================
  // 4️⃣ MERGE ROLE INTO RESPONSE
  // ===============================
  const items = employees.map(e => ({
    ...e,
    role: roleMap.get(e._id.toString()) || "—",
  }));

  return { items, total };
}





  async getAllManagers() {
    const managerRoles = await this.employeeModel
      .find({
        roles: { $in: ['DEPARTMENT_HEAD'] },
        isActive: true,
      })
      .lean();

    const managerIds = managerRoles.map((r) => r._id);

    return this.employeeModel
      .find({ _id: { $in: managerIds } })
      .lean();
  }

  async getDepartmentManagers(departmentId: string) {
    const roleRecords = await this.employeeSystemRoleModel
      .find({
        roles: SystemRole.DEPARTMENT_HEAD,
        isActive: true,
      })
      .lean();

    const dhIds = roleRecords.map((r) => r.employeeProfileId);
    if (dhIds.length === 0) return [];

    return this.employeeModel
      .find({
        _id: { $in: dhIds },
        primaryDepartmentId: departmentId,
      })
      .select('firstName lastName employeeNumber primaryDepartmentId')
      .lean();
  }

  async createManager(dto: CreateManagerDto) {
    const exists = await this.employeeModel.findOne({
      employeeNumber: dto.employeeNumber,
    });

    if (exists) {
      throw new ConflictException(
        `Employee number ${dto.employeeNumber} already exists`,
      );
    }

    return this.employeeModel.create({
      ...dto,
      systemRole: 'MANAGER',
    });
  }

 async findOne(id: string) {
  const employee = await this.employeeModel
    .findById(id)
    .populate({
      path: 'primaryDepartmentId',
      select: 'name',           // ✅ matches Department schema
    })
    .populate({
      path: 'primaryPositionId',
      select: 'title',          // ✅ matches Position schema
    })
    .populate({
      path: 'supervisorPositionId',
      select: 'title',          // ✅ matches Position schema
    })
    .lean();

  if (!employee) {
    throw new NotFoundException('Employee not found');
  }

  return employee;
}



  async setPassword(id: string, password: string) {
    const employee = await this.employeeModel.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found 🧑‍🏫');
    }

    const hashed = await bcrypt.hash(password, 10);

    await this.employeeModel.findByIdAndUpdate(
      id,
      { password: hashed },
      { new: true },
    );

    return { message: 'Password updated successfully 🔐', id };
  }

  async update(id: string, updateDto: UpdateEmployeeDto) {
    const payload: any = { ...updateDto };

    if (updateDto.dateOfHire) {
      payload.dateOfHire = new Date(updateDto.dateOfHire);
    }
    if (updateDto.contractStartDate) {
      payload.contractStartDate = new Date(updateDto.contractStartDate);
    }
    if (updateDto.contractEndDate) {
      payload.contractEndDate = new Date(updateDto.contractEndDate);
    }

    const updated = await this.employeeModel
      .findByIdAndUpdate(id, payload, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    return updated;
  }

  async deactivate(id: string) {
    const employee = await this.employeeModel.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found 🧑‍🏫');
    }

    const oldStatus = employee.status;

    const updated = await this.employeeModel
      .findByIdAndUpdate(
        id,
        { status: EmployeeStatus.INACTIVE },
        { new: true },
      )
      .lean();

    return {
      message: 'Employee is now deactivated 😴',
      id,
      oldStatus,
      newStatus: EmployeeStatus.INACTIVE,
      updatedEmployee: updated,
    };
  }
 async selfUpdate(employeeId: string, dto: SelfUpdateDto) {
  const allowed = [
    'phone',
    'personalEmail',
    'workEmail',
    'biography',
    'address',
  ];

  const payload: any = {};
  for (const key of allowed) {
    if (dto[key] !== undefined) {
      payload[key] = dto[key];
    }
  }

  const updated = await this.employeeModel.findByIdAndUpdate(
    employeeId,
    { $set: payload },
    {
      new: true,
      strict: false,   // 🔥 THIS LINE IS THE FIX
    },
  ).lean();

  if (!updated) {
    throw new NotFoundException('Employee not found');
  }

  return updated;
}




  async createChangeRequest(employeeId: string, dto: CreateChangeRequestDto) {
    if (!dto) {
      throw new UnauthorizedException('Request body is empty ❌');
    }

    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found ❌');
    }

    const profileId = dto.employeeProfileId;
    if (!profileId) {
      throw new ForbiddenException(
        'employeeProfileId is required in body ❌',
      );
    }

    const ALLOWED_FIELDS: CreateChangeRequestDto['field'][] = [
      'firstName',
      'lastName',
      'lastName',
      'nationalId',
      'primaryPositionId',
      'primaryDepartmentId',
      'contractType',
      'workType',
    ];

    if (!ALLOWED_FIELDS.includes(dto.field)) {
      throw new ForbiddenException(
        `Invalid field '${dto.field}' ❌`,
      );
    }

    const requestId = randomUUID();

    const requestDescription = JSON.stringify({
      field: dto.field,
      newValue: dto.newValue,
      reason: dto.reason ?? '',
    });

    const created = new this.changeRequestModel({
      requestId,
      employeeProfileId: profileId,
      field: dto.field,
      newValue: dto.newValue,
      reason: dto.reason ?? '',
      requestDescription,
      status: ProfileChangeStatus.PENDING,
      submittedAt: new Date(),
    });

    return created.save();
  }

  async getEmployeeChangeRequests(employeeProfileId: string) {
    return this.changeRequestModel
      .find({ employeeProfileId })
      .sort({ submittedAt: -1 })
      .lean();
  }

  async approveChangeRequest(changeRequestMongoId: string) {
    const request = await this.changeRequestModel.findById(
      changeRequestMongoId,
    );
    if (!request) {
      throw new NotFoundException('Change request not found ❌');
    }

    const raw = (request as any).requestDescription;
    let data: { field: string; newValue: string; reason?: string };

    if (typeof raw === 'string') {
      if (raw.trim().startsWith('{')) {
        data = JSON.parse(raw);
      } else {
        data = {
          field: (request as any).field,
          newValue: (request as any).newValue,
          reason: raw,
        };
      }
    } else {
      data = raw as any;
    }

    if (!data.field || !data.newValue) {
      throw new BadRequestException(
        'Change request is missing field/newValue ❌',
      );
    }

    const employeeProfileId = (request as any).employeeProfileId;
    const employee = await this.employeeModel.findById(employeeProfileId);
    if (!employee) {
      throw new NotFoundException('Employee not found ❌');
    }

    await this.employeeModel.findByIdAndUpdate(employeeProfileId, {
      [data.field]: data.newValue,
    });

    await this.changeRequestModel.findByIdAndUpdate(
      changeRequestMongoId,
      { status: ProfileChangeStatus.APPROVED },
    );

    return { message: 'Change request approved and employee updated ✅' };
  }

  async rejectChangeRequest(id: string, reason: string) {
    const request = await this.changeRequestModel.findById(id);
    if (!request) throw new NotFoundException('Request not found');

    request.status = ProfileChangeStatus.REJECTED;
    request.processedAt = new Date();
    request.reason = reason;

    return request.save();
  }

 async getTeamSummaryForManager(managerId: string) {
  return this.employeeModel
    .find({ supervisorPositionId: managerId })
    .populate('primaryDepartmentId', 'name')
    .populate('primaryPositionId', 'title name')
    .select('firstName lastName employeeNumber status dateOfHire primaryDepartmentId primaryPositionId')
    .lean();
}

  async getTeamEmployeeSummary(managerId: string, employeeId: string) {
  return this.employeeModel
    .findById(employeeId)
    .populate("primaryDepartmentId", "name")
    .populate("primaryPositionId", "title name")
    .select(
      "firstName lastName employeeNumber status dateOfHire workEmail personalEmail primaryDepartmentId primaryPositionId"
    )
    .lean();
}


  async getAllChangeRequests() {
    return this.changeRequestModel
      .find()
      .sort({ submittedAt: -1 })
      .lean();
  }

  async findChangeRequestByUUID(requestId: string) {
    const request = await this.changeRequestModel
      .findOne({ requestId })
      .lean();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async submitDispute(dto: {
    employeeProfileId: string;
    originalRequestId: string;
    dispute: string;
  }) {
    const requestId = randomUUID();

    const created = new this.changeRequestModel({
      requestId,
      employeeProfileId: dto.employeeProfileId,
      requestDescription: `disputeFor:${dto.originalRequestId}`,
      reason: dto.dispute,
      status: ProfileChangeStatus.PENDING,
      submittedAt: new Date(),
    });

    return created.save();
  }

  async withdrawChangeRequest(id: string) {
    const request = await this.changeRequestModel.findById(id);
    if (!request) throw new NotFoundException('Request not found');

    if (request.status !== ProfileChangeStatus.PENDING) {
      throw new Error('Only pending requests can be withdrawn');
    }

    request.status = ProfileChangeStatus.REJECTED;
    request.reason = 'Withdrawn by employee';
    request.processedAt = new Date();

    await request.save();

    return {
      message: 'Change request withdrawn successfully',
      requestId: request.requestId,
      status: request.status,
    };
  }

  async resolveDispute(id: string, resolution: string) {
    const dispute = await this.changeRequestModel.findById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.status = ProfileChangeStatus.REJECTED;
    dispute.reason = resolution;
    dispute.processedAt = new Date();

    return dispute.save();
  }

  async approveDispute(id: string, resolution: string) {
    const dispute = await this.changeRequestModel.findById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.status = ProfileChangeStatus.APPROVED;
    dispute.reason = resolution;
    dispute.processedAt = new Date();

    return dispute.save();
  }

  async getMyProfile(userId: string) {
    const me = await this.employeeModel
      .findById(userId)
      .populate('primaryDepartmentId', 'name')
      .populate('primaryPositionId', 'title name')
      .lean();
    if (!me) throw new NotFoundException('Profile not found');
    return me;
  }

  async getDepartmentHeads() {
    const roleDocs = await this.employeeModel
      .find({
        roles: 'DEPARTMENT_HEAD',
        isActive: true,
      })
      .lean();

    const employeeIds = roleDocs.map((r) => r._id);

    return this.employeeModel
      .find({ _id: { $in: employeeIds } })
      .lean();
  }

  async assignManager(employeeId: string, managerId: string) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employeeId');
    }

    if (!Types.ObjectId.isValid(managerId)) {
      throw new BadRequestException('Invalid managerId');
    }

    return this.employeeModel.findByIdAndUpdate(
      employeeId,
      { supervisorPositionId: managerId },
      { new: true },
    );
  }
  
  

}
