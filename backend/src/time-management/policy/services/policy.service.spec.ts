import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PolicyService } from './policy.service';
import { TimePolicy, PolicyScope } from '../schemas/time-policy.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PolicyService', () => {
  let service: PolicyService;
  let policyModel: Model<any>;

  const mockPolicy = {
    _id: new Types.ObjectId(),
    name: 'Test Policy',
    scope: PolicyScope.GLOBAL,
    active: true,
    save: jest.fn().mockResolvedValue(this),
    deleteOne: jest.fn().mockResolvedValue({}),
    toObject: jest.fn().mockReturnValue({
      name: 'Test Policy',
      scope: PolicyScope.GLOBAL,
      active: true,
    }),
  } as any;

  beforeEach(async () => {
    // Create a mock model class that can be instantiated
    class MockModel {
      data: any;
      constructor(data: any) {
        this.data = data;
      }
      save = jest.fn().mockImplementation(() => {
        return Promise.resolve({ ...this.data, _id: new Types.ObjectId() });
      });
      static findOne = jest.fn();
      static find = jest.fn();
      static findById = jest.fn();
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: getModelToken(TimePolicy.name),
          useValue: MockModel as any,
        },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    policyModel = module.get<Model<any>>(getModelToken(TimePolicy.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a policy successfully', async () => {
      const policyData = {
        name: 'New Policy',
        scope: PolicyScope.GLOBAL,
        active: true,
      };

      const result = await service.create(policyData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('_id');
    });

    it('should throw error if department scope without departmentId', async () => {
      const policyData = {
        name: 'Department Policy',
        scope: PolicyScope.DEPARTMENT,
      };

      await expect(service.create(policyData)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if employee scope without employeeId', async () => {
      const policyData = {
        name: 'Employee Policy',
        scope: PolicyScope.EMPLOYEE,
      };

      await expect(service.create(policyData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return policy if found', async () => {
      jest.spyOn(policyModel, 'findById').mockResolvedValue(mockPolicy);

      const result = await service.findById(mockPolicy._id);

      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException if policy not found', async () => {
      jest.spyOn(policyModel, 'findById').mockResolvedValue(null);

      await expect(service.findById(new Types.ObjectId())).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignToEmployee', () => {
    it('should create employee-specific policy copy', async () => {
      const employeeId = new Types.ObjectId();
      const mockPolicyWithToObject = {
        ...mockPolicy,
        toObject: jest.fn().mockReturnValue({
          name: 'Test Policy',
          scope: PolicyScope.GLOBAL,
          active: true,
        }),
      };
      jest.spyOn(policyModel, 'findById').mockResolvedValue(mockPolicyWithToObject as any);

      const result = await service.assignToEmployee(mockPolicy._id, employeeId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('_id');
    });
  });
});

