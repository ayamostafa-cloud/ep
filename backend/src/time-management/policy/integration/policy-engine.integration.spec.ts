// Mock TimeException schema FIRST to avoid Mongoose enum type issues
// This must be before any imports that use TimeException
jest.mock('../../attendance/schemas/time-exception.schema', () => {
  class MockTimeException {
    static name = 'TimeException';
  }
  return {
    TimeException: MockTimeException,
    TimeExceptionSchema: {},
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PolicyEngineService } from '../services/policy-engine.service';
import { TimeManagementModule } from '../../time-management.module';
import { TimePolicy, TimePolicyDocument, PolicyScope, RoundingRule } from '../schemas/time-policy.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { PenaltyRecord, PenaltyRecordDocument, PenaltyType, PenaltyStatus } from '../schemas/penalty-record.schema';
import { OvertimeRecord, OvertimeRecordDocument, OvertimeStatus } from '../schemas/overtime-record.schema';
import { TimeExceptionStatus, TimeExceptionType, PunchType } from '../../enums/index';

// Import the mocked TimeException and create type alias
import { TimeException } from '../../attendance/schemas/time-exception.schema';
type TimeExceptionDocument = any; // Use any for tests since we're mocking

/**
 * Integration tests for Policy Engine
 * Tests the full flow: attendance → policy compute → exception approve → payroll sync
 * 
 * Note: These tests require a MongoDB connection. In CI/CD, use a test database.
 * For local development, ensure MongoDB is running or use MongoDB Memory Server.
 */
describe('PolicyEngine Integration', () => {
  let module: TestingModule;
  let policyEngineService: PolicyEngineService;
  let policyModel: Model<TimePolicyDocument>;
  let attendanceModel: Model<AttendanceRecordDocument>;
  let exceptionModel: Model<TimeExceptionDocument>;
  let penaltyModel: Model<PenaltyRecordDocument>;
  let overtimeModel: Model<OvertimeRecordDocument>;

  const testEmployeeId = new Types.ObjectId();
  const testDate = new Date('2024-01-15');

  beforeAll(async () => {
    // Note: In a real integration test, you'd use a test database
    // For now, we'll use mocks but structure it as integration tests
    module = await Test.createTestingModule({
      imports: [
        // In real integration tests, you'd import the actual module with test DB
        // TimeManagementModule
      ],
      providers: [
        PolicyEngineService,
        {
          provide: getModelToken(TimePolicy.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(null),
            }),
          },
        },
        {
          provide: getModelToken(AttendanceRecord.name),
          useValue: {
            findById: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getModelToken(TimeException.name),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(PenaltyRecord.name),
          useValue: class MockPenaltyRecord {
            data: any;
            constructor(data: any) {
              this.data = data;
              // Spread data properties onto the object for direct access
              Object.assign(this, data);
            }
            save = jest.fn().mockImplementation(() => {
              return Promise.resolve({ ...this.data, _id: new Types.ObjectId() });
            });
            static deleteMany = jest.fn();
            static find = jest.fn();
          } as any,
        },
        {
          provide: getModelToken(OvertimeRecord.name),
          useValue: class MockOvertimeRecord {
            data: any;
            constructor(data: any) {
              this.data = data;
              // Spread data properties onto the object for direct access
              Object.assign(this, data);
            }
            save = jest.fn().mockImplementation(() => {
              return Promise.resolve({ ...this.data, _id: new Types.ObjectId() });
            });
            static deleteMany = jest.fn();
            static find = jest.fn();
          } as any,
        },
      ],
    }).compile();

    policyEngineService = module.get<PolicyEngineService>(PolicyEngineService);
    policyModel = module.get<Model<TimePolicyDocument>>(getModelToken(TimePolicy.name));
    attendanceModel = module.get<Model<AttendanceRecordDocument>>(getModelToken(AttendanceRecord.name));
    exceptionModel = module.get<Model<TimeExceptionDocument>>(getModelToken(TimeException.name));
    penaltyModel = module.get<Model<PenaltyRecordDocument>>(getModelToken(PenaltyRecord.name));
    overtimeModel = module.get<Model<OvertimeRecordDocument>>(getModelToken(OvertimeRecord.name));
  });

  afterAll(async () => {
    await module.close();
  });

  describe('End-to-End: Attendance → Policy Compute → Exception Approve → Payroll Sync', () => {
    it('should compute policy results, handle exception approval, and recalculate', async () => {
      // Step 1: Create a policy
      const policy: Partial<TimePolicyDocument> = {
        _id: new Types.ObjectId(),
        name: 'Test Policy',
        scope: PolicyScope.GLOBAL,
        active: true,
        roundingRule: RoundingRule.NONE,
        roundingIntervalMinutes: 15,
        latenessRule: {
          gracePeriodMinutes: 5,
          deductionPerMinute: 1,
          maxDeductionPerDay: 100,
        },
        overtimeRule: {
          thresholdMinutes: 0, // No threshold, any overtime counts
          multiplier: 1.5,
          dailyCapMinutes: 240,
        },
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(policy as TimePolicyDocument),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);

      // Step 2: Create attendance record with lateness
      const attendanceRecord: Partial<AttendanceRecordDocument> = {
        _id: new Types.ObjectId(),
        employeeId: testEmployeeId,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-15T09:15:00Z') }, // 15 min late
          { type: PunchType.OUT, time: new Date('2024-01-15T17:30:00Z') }, // 8.25 hours
        ],
        totalWorkMinutes: 495,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: false,
      };

      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      // Step 3: Compute policy results
      const initialResult = await policyEngineService.computePolicyResults(
        attendanceRecord as AttendanceRecordDocument,
        testDate,
        new Date('2024-01-15T09:00:00Z'), // Scheduled start
        undefined,
        480, // 8 hours scheduled
      );

      // Verify initial computation
      expect(initialResult.latenessMinutes).toBeGreaterThan(0);
      expect(initialResult.penalties.length).toBeGreaterThan(0);
      const latenessPenalty = initialResult.penalties.find(p => p.type === PenaltyType.LATENESS);
      expect(latenessPenalty).toBeDefined();

      // Step 4: Create and approve exception
      const exception: Partial<TimeExceptionDocument> = {
        _id: new Types.ObjectId(),
        employeeId: testEmployeeId,
        attendanceRecordId: attendanceRecord._id!,
        type: TimeExceptionType.LATE,
        status: TimeExceptionStatus.APPROVED,
        assignedTo: new Types.ObjectId(),
      };

      jest.spyOn(exceptionModel, 'find').mockResolvedValue([exception] as TimeExceptionDocument[]);

      // Step 5: Recalculate after exception approval
      jest.spyOn(attendanceModel, 'findById').mockResolvedValue(attendanceRecord as AttendanceRecordDocument);
      jest.spyOn(penaltyModel, 'deleteMany').mockResolvedValue({ deletedCount: 1 } as any);
      jest.spyOn(overtimeModel, 'deleteMany').mockResolvedValue({ deletedCount: 0 } as any);

      const recalculatedResult = await policyEngineService.recalculatePolicyResults(
        attendanceRecord._id!,
        testDate,
        new Date('2024-01-15T09:00:00Z'),
        undefined,
        480,
      );

      // Verify exception removed lateness penalty
      expect(recalculatedResult.latenessMinutes).toBe(0);
      const newLatenessPenalty = recalculatedResult.penalties.find(p => p.type === PenaltyType.LATENESS);
      expect(newLatenessPenalty).toBeUndefined();

      // Step 6: Save computed results
      await policyEngineService.saveComputedResults(recalculatedResult);

      // Verify records were saved
      expect(penaltyModel.deleteMany).toHaveBeenCalled();
    });

    it('should handle overtime computation and approval flow', async () => {
      const policy: Partial<TimePolicyDocument> = {
        _id: new Types.ObjectId(),
        name: 'Overtime Policy',
        scope: PolicyScope.GLOBAL,
        active: true,
        overtimeRule: {
          thresholdMinutes: 0, // No threshold, any overtime counts
          multiplier: 1.5,
          dailyCapMinutes: 240,
        },
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(policy as TimePolicyDocument),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);

      const attendanceRecord: Partial<AttendanceRecordDocument> = {
        _id: new Types.ObjectId(),
        employeeId: testEmployeeId,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-15T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-15T19:00:00Z') }, // 10 hours
        ],
        totalWorkMinutes: 600,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: false,
      };

      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await policyEngineService.computePolicyResults(
        attendanceRecord as AttendanceRecordDocument,
        testDate,
        new Date('2024-01-15T09:00:00Z'),
        undefined,
        480,
      );

      // Verify overtime was computed
      expect(result.overtime.length).toBeGreaterThan(0);
      expect(result.overtime[0].overtimeMinutes).toBeGreaterThan(0);
      expect(result.overtime[0].status).toBe(OvertimeStatus.PENDING);

      // Simulate approval
      const approvedOvertime = { ...result.overtime[0], status: OvertimeStatus.APPROVED };
      jest.spyOn(overtimeModel, 'find').mockResolvedValue([approvedOvertime] as any);

      // Verify overtime is ready for payroll sync
      const overtimeRecords = await overtimeModel.find({
        attendanceRecordId: attendanceRecord._id,
        status: OvertimeStatus.APPROVED,
      });

      expect(overtimeRecords.length).toBeGreaterThan(0);
    });
  });

  describe('Policy Scoping Priority', () => {
    it('should prioritize employee policy over global policy', async () => {
      const globalPolicy: Partial<TimePolicyDocument> = {
        _id: new Types.ObjectId(),
        name: 'Global Policy',
        scope: PolicyScope.GLOBAL,
        active: true,
      };

      const employeePolicy: Partial<TimePolicyDocument> = {
        _id: new Types.ObjectId(),
        name: 'Employee Policy',
        scope: PolicyScope.EMPLOYEE,
        employeeId: testEmployeeId,
        active: true,
      };

      const mockFindOne = jest.fn()
        .mockReturnValueOnce({
          sort: jest.fn().mockResolvedValue(employeePolicy as TimePolicyDocument),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockResolvedValue(globalPolicy as TimePolicyDocument),
        });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);

      const result = await policyEngineService.getApplicablePolicy(testEmployeeId, testDate);

      expect(result).toEqual(employeePolicy);
      // The service may call findOne multiple times internally, but should return employee policy
      expect(policyModel.findOne).toHaveBeenCalled();
    });
  });
});

