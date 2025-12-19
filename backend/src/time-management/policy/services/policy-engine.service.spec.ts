// Mock TimeException schema FIRST to avoid Mongoose enum type issues
// This must be before any imports that use TimeException
class MockTimeException {
  static name = 'TimeException';
}
jest.mock('../../attendance/schemas/time-exception.schema', () => ({
  TimeException: MockTimeException,
  TimeExceptionSchema: {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PolicyEngineService } from './policy-engine.service';
import { TimePolicy } from '../schemas/time-policy.schema';
import { AttendanceRecord } from '../../attendance/schemas/attendance-record.schema';
import { PenaltyRecord, PenaltyType } from '../schemas/penalty-record.schema';
import { OvertimeRecord } from '../schemas/overtime-record.schema';
import { PolicyScope, RoundingRule } from '../schemas/time-policy.schema';
import { PunchType, TimeExceptionType, TimeExceptionStatus } from '../../enums/index';

// Import the mocked TimeException
import { TimeException } from '../../attendance/schemas/time-exception.schema';

describe('PolicyEngineService', () => {
  let service: PolicyEngineService;
  let policyModel: Model<any>;
  let attendanceModel: Model<any>;
  let exceptionModel: Model<any>;
  let penaltyModel: Model<any>;
  let overtimeModel: Model<any>;

  const mockPolicy = {
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
      thresholdMinutes: 480, // 8 hours
      multiplier: 1.5,
      dailyCapMinutes: 240, // 4 hours
    },
    shortTimeRule: {
      minimumWorkMinutes: 480,
      penaltyPerMinute: 0.5,
      gracePeriodMinutes: 15,
    },
  };

  const mockAttendanceRecord = {
    _id: new Types.ObjectId(),
    employeeId: new Types.ObjectId(),
    punches: [
      { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
      { type: PunchType.OUT, time: new Date('2024-01-01T17:00:00Z') },
    ],
    totalWorkMinutes: 480,
    hasMissedPunch: false,
    exceptionIds: [],
    finalisedForPayroll: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
          },
        },
        {
          provide: getModelToken(TimeException.name),
          useValue: {
            find: jest.fn(),
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

    service = module.get<PolicyEngineService>(PolicyEngineService);
    policyModel = module.get<Model<any>>(getModelToken(TimePolicy.name));
    attendanceModel = module.get<Model<any>>(getModelToken(AttendanceRecord.name));
    exceptionModel = module.get<Model<any>>(getModelToken(TimeException.name));
    penaltyModel = module.get<Model<any>>(getModelToken(PenaltyRecord.name));
    overtimeModel = module.get<Model<any>>(getModelToken(OvertimeRecord.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApplicablePolicy', () => {
    it('should return employee-specific policy if available', async () => {
      const employeePolicy = { ...mockPolicy, scope: PolicyScope.EMPLOYEE };
      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(employeePolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);

      const result = await service.getApplicablePolicy(
        new Types.ObjectId(),
        new Date(),
      );

      expect(result).toEqual(employeePolicy);
      expect(policyModel.findOne).toHaveBeenCalled();
    });

    it('should fall back to global policy if no employee policy', async () => {
      let callCount = 0;
      const mockFindOne = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: employee policy (returns null)
          return {
            sort: jest.fn().mockResolvedValue(null),
          };
        } else {
          // Second call: global policy
          return {
            sort: jest.fn().mockResolvedValue(mockPolicy),
          };
        }
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);

      const result = await service.getApplicablePolicy(
        new Types.ObjectId(),
        new Date(),
      );

      expect(result).toEqual(mockPolicy);
    });
  });

  describe('calculateWorkedMinutes', () => {
    it('should calculate correct worked minutes from punches', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-01T17:30:00Z') },
        ],
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        new Date('2024-01-01T09:00:00Z'),
        undefined,
        480,
      );

      expect(result.workedMinutes).toBeGreaterThanOrEqual(480);
    });
  });

  describe('computePenalties', () => {
    it('should compute lateness penalty correctly', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:15:00Z') }, // 15 minutes late
          { type: PunchType.OUT, time: new Date('2024-01-01T17:00:00Z') },
        ],
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        new Date('2024-01-01T09:00:00Z'),
        undefined,
        480,
      );

      // Should have lateness penalty (15 - 5 grace = 10 minutes * 1 = 10)
      expect(result.penalties.length).toBeGreaterThan(0);
      const latenessPenalty = result.penalties.find(p => p.type === PenaltyType.LATENESS);
      expect(latenessPenalty).toBeDefined();
    });
  });

  describe('computeOvertime', () => {
    it('should compute overtime correctly when worked hours exceed scheduled', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-01T19:00:00Z') }, // 10 hours = 600 minutes
        ],
        totalWorkMinutes: 600,
      };

      // Policy with threshold of 0 so any overtime counts
      const overtimePolicy = {
        ...mockPolicy,
        overtimeRule: {
          thresholdMinutes: 0, // No threshold, any overtime counts
          multiplier: 1.5,
        },
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(overtimePolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        new Date('2024-01-01T09:00:00Z'),
        undefined,
        480, // 8 hours scheduled, so 120 minutes overtime
      );

      // 600 worked - 480 scheduled = 120 minutes overtime
      expect(result.overtime.length).toBeGreaterThan(0);
      expect(result.overtime[0].overtimeMinutes).toBe(120);
    });

    it('should apply daily cap on overtime', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-01T22:00:00Z') }, // 13 hours = 780 minutes
        ],
        totalWorkMinutes: 780,
      };

      // Policy with threshold 0 and daily cap of 240
      const cappedPolicy = {
        ...mockPolicy,
        overtimeRule: {
          thresholdMinutes: 0,
          multiplier: 1.5,
          dailyCapMinutes: 240,
        },
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(cappedPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        new Date('2024-01-01T09:00:00Z'),
        undefined,
        480, // 8 hours scheduled, so 300 minutes overtime (but capped at 240)
      );

      // Should cap at dailyCapMinutes (240 = 4 hours)
      expect(result.overtime.length).toBeGreaterThan(0);
      expect(result.overtime[0].overtimeMinutes).toBeLessThanOrEqual(240);
    });

    it('should use weekend multiplier for weekend overtime', async () => {
      const weekendPolicy = {
        ...mockPolicy,
        overtimeRule: {
          thresholdMinutes: 0,
          multiplier: 1.5,
          weekendMultiplier: 2.0,
        },
        weekendRule: {
          enabled: true,
          weekendDays: [6], // Saturday
        },
      };

      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-06T09:00:00Z') }, // Saturday
          { type: PunchType.OUT, time: new Date('2024-01-06T19:00:00Z') }, // 10 hours = 600 minutes
        ],
        totalWorkMinutes: 600,
      };

      const mockFindOneWeekend = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(weekendPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOneWeekend);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-06'), // Saturday
        new Date('2024-01-06T09:00:00Z'),
        undefined,
        480, // 8 hours scheduled, so 120 minutes overtime
      );

      expect(result.overtime.length).toBeGreaterThan(0);
      expect(result.overtime[0].multiplier).toBe(2.0);
      expect(result.overtime[0].isWeekend).toBe(true);
    });
  });

  describe('rounding rules', () => {
    it('should round up when ROUND_UP is specified', async () => {
      const roundingPolicy = {
        ...mockPolicy,
        roundingRule: RoundingRule.ROUND_UP,
        roundingIntervalMinutes: 15,
      };

      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-01T17:07:00Z') }, // 487 minutes
        ],
      };

      const mockFindOneRounding = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(roundingPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOneRounding);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        undefined,
        undefined,
        480,
      );

      // 487 should round up to 495 (33 * 15)
      expect(result.workedMinutes).toBe(495);
    });

    it('should round down when ROUND_DOWN is specified', async () => {
      const roundingPolicy = {
        ...mockPolicy,
        roundingRule: RoundingRule.ROUND_DOWN,
        roundingIntervalMinutes: 15,
      };

      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-01T17:07:00Z') }, // 487 minutes
        ],
      };

      const mockFindOneRounding = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(roundingPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOneRounding);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        undefined,
        undefined,
        480,
      );

      // 487 should round down to 480 (32 * 15)
      expect(result.workedMinutes).toBe(480);
    });
  });

  describe('short-time penalties', () => {
    it('should compute short-time penalty correctly', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-01T16:30:00Z') }, // 7.5 hours = 450 minutes
        ],
        totalWorkMinutes: 450,
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        undefined,
        undefined,
        480, // 8 hours scheduled
      );

      const shortTimePenalty = result.penalties.find(p => p.type === PenaltyType.SHORT_TIME);
      expect(shortTimePenalty).toBeDefined();
      expect(shortTimePenalty?.minutes).toBeGreaterThan(0);
    });

    it('should apply grace period to short-time penalty', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:00:00Z') },
          { type: PunchType.OUT, time: new Date('2024-01-01T16:50:00Z') }, // 470 minutes (10 min short)
        ],
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        undefined,
        undefined,
        480, // 8 hours scheduled, 15 min grace period
      );

      // 10 minutes short, but 15 min grace period, so no penalty
      const shortTimePenalty = result.penalties.find(p => p.type === PenaltyType.SHORT_TIME);
      expect(shortTimePenalty).toBeUndefined();
    });
  });

  describe('exception handling', () => {
    it('should remove lateness penalty when LATE exception is approved', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T09:15:00Z') }, // 15 minutes late
          { type: PunchType.OUT, time: new Date('2024-01-01T17:00:00Z') },
        ],
      };

      const approvedException = {
        _id: new Types.ObjectId(),
        type: TimeExceptionType.LATE,
        status: TimeExceptionStatus.APPROVED,
        attendanceRecordId: record._id,
      };

      const mockFindOneException = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOneException);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([approvedException] as any);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        new Date('2024-01-01T09:00:00Z'),
        undefined,
        480,
      );

      // Lateness should be 0 due to approved exception
      expect(result.latenessMinutes).toBe(0);
      const latenessPenalty = result.penalties.find(p => p.type === PenaltyType.LATENESS);
      expect(latenessPenalty).toBeUndefined();
    });
  });

  describe('penalty caps', () => {
    it('should apply max deduction cap for lateness', async () => {
      const record = {
        ...mockAttendanceRecord,
        punches: [
          { type: PunchType.IN, time: new Date('2024-01-01T10:00:00Z') }, // 60 minutes late
          { type: PunchType.OUT, time: new Date('2024-01-01T17:00:00Z') },
        ],
      };

      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);

      const result = await service.computePolicyResults(
        record as any,
        new Date('2024-01-01'),
        new Date('2024-01-01T09:00:00Z'),
        undefined,
        480,
      );

      const latenessPenalty = result.penalties.find(p => p.type === PenaltyType.LATENESS);
      expect(latenessPenalty).toBeDefined();
      // Should be capped at maxDeductionPerDay (100)
      // 60 - 5 grace = 55 minutes * 1 = 55, but capped at 100
      expect(latenessPenalty?.amount).toBeLessThanOrEqual(100);
    });
  });

  describe('recalculatePolicyResults', () => {
    it('should delete existing pending records before recalculating', async () => {
      const recordId = new Types.ObjectId();
      jest.spyOn(attendanceModel, 'findById').mockResolvedValue(mockAttendanceRecord as any);
      const mockFindOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPolicy),
      });
      jest.spyOn(policyModel, 'findOne').mockImplementation(mockFindOne);
      jest.spyOn(exceptionModel, 'find').mockResolvedValue([]);
      jest.spyOn(penaltyModel, 'deleteMany').mockResolvedValue({ deletedCount: 2 } as any);
      jest.spyOn(overtimeModel, 'deleteMany').mockResolvedValue({ deletedCount: 1 } as any);

      await service.recalculatePolicyResults(
        recordId,
        new Date('2024-01-01'),
        new Date('2024-01-01T09:00:00Z'),
        undefined,
        480,
      );

      expect(penaltyModel.deleteMany).toHaveBeenCalled();
      expect(overtimeModel.deleteMany).toHaveBeenCalled();
    });
  });
});

