import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Model } from 'mongoose';
import { ScheduleAssignmentService } from './schedule-assignment.service';
import { ShiftTemplateService } from './shift-template.service';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
import { CreateScheduleAssignmentDto } from '../dto/create-schedule-assignment.dto';
import { BulkAssignShiftDto } from '../dto/bulk-assign-shift.dto';
import { QueryAssignmentsDto } from '../dto/query-assignments.dto';

describe('ScheduleAssignmentService', () => {
  let service: ScheduleAssignmentService;
  let scheduleAssignmentModel: Model<ScheduleAssignmentDocument>;
  let shiftTemplateModel: Model<ShiftTemplateDocument>;
  let shiftTemplateService: ShiftTemplateService;

  const mockShiftTemplate = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Normal Shift',
    type: 'normal',
  };

  const mockAssignment = {
    _id: '507f1f77bcf86cd799439020',
    shiftTemplateId: '507f1f77bcf86cd799439011',
    employeeId: '507f1f77bcf86cd799439012',
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: new Date('2025-12-31'),
    assignedBy: '507f1f77bcf86cd799439015',
    source: 'manual',
    status: 'Active',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockScheduleAssignmentModel = {
    find: jest.fn(),
    create: jest.fn(),
    new: jest.fn().mockResolvedValue(mockAssignment),
    constructor: jest.fn().mockResolvedValue(mockAssignment),
  };

  const mockShiftTemplateModel = {
    find: jest.fn(),
  };

  const mockShiftTemplateService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleAssignmentService,
        {
          provide: getModelToken(ScheduleAssignment.name),
          useValue: mockScheduleAssignmentModel,
        },
        {
          provide: getModelToken(ShiftTemplate.name),
          useValue: mockShiftTemplateModel,
        },
        {
          provide: ShiftTemplateService,
          useValue: mockShiftTemplateService,
        },
      ],
    }).compile();

    service = module.get<ScheduleAssignmentService>(ScheduleAssignmentService);
    scheduleAssignmentModel = module.get<Model<ScheduleAssignmentDocument>>(
      getModelToken(ScheduleAssignment.name),
    );
    shiftTemplateModel = module.get<Model<ShiftTemplateDocument>>(
      getModelToken(ShiftTemplate.name),
    );
    shiftTemplateService =
      module.get<ShiftTemplateService>(ShiftTemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assign', () => {
    const createDto: CreateScheduleAssignmentDto = {
      shiftTemplateId: '507f1f77bcf86cd799439011',
      employeeId: '507f1f77bcf86cd799439012',
      effectiveFrom: '2025-01-01T00:00:00.000Z',
      effectiveTo: '2025-12-31T23:59:59.000Z',
      assignedBy: '507f1f77bcf86cd799439015',
    };

    it('should create an assignment successfully', async () => {
      mockShiftTemplateService.findById.mockResolvedValue(mockShiftTemplate);
      const mockFind = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });
      jest
        .spyOn(scheduleAssignmentModel, 'find')
        .mockReturnValue(mockFind as any);
      const mockSave = jest.fn().mockResolvedValue(mockAssignment);
      const mockInstance = { ...mockAssignment, save: mockSave };
      jest
        .spyOn(scheduleAssignmentModel, 'create')
        .mockResolvedValue(mockInstance as any);

      const result = await service.assign(createDto);

      expect(mockShiftTemplateService.findById).toHaveBeenCalledWith(
        createDto.shiftTemplateId,
      );
      expect(scheduleAssignmentModel.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when no target provided', async () => {
      const invalidDto = { ...createDto, employeeId: undefined };
      await expect(service.assign(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when multiple targets provided', async () => {
      const invalidDto = {
        ...createDto,
        departmentId: '507f1f77bcf86cd799439016',
      };
      await expect(service.assign(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid date range', async () => {
      const invalidDto = {
        ...createDto,
        effectiveFrom: '2025-12-31T00:00:00.000Z',
        effectiveTo: '2025-01-01T00:00:00.000Z',
      };
      await expect(service.assign(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when conflicts exist', async () => {
      mockShiftTemplateService.findById.mockResolvedValue(mockShiftTemplate);
      const mockFind = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockAssignment]),
      });
      jest
        .spyOn(scheduleAssignmentModel, 'find')
        .mockReturnValue(mockFind as any);

      await expect(service.assign(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('bulkAssign', () => {
    const bulkDto: BulkAssignShiftDto = {
      shiftTemplateId: '507f1f77bcf86cd799439011',
      employeeIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
      effectiveFrom: '2025-01-01T00:00:00.000Z',
      effectiveTo: '2025-12-31T23:59:59.000Z',
      assignedBy: '507f1f77bcf86cd799439015',
    };

    it('should bulk assign to multiple employees', async () => {
      mockShiftTemplateService.findById.mockResolvedValue(mockShiftTemplate);
      const mockFind = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });
      jest
        .spyOn(scheduleAssignmentModel, 'find')
        .mockReturnValue(mockFind as any);
      const mockSave = jest.fn().mockResolvedValue(mockAssignment);
      const mockInstance = { ...mockAssignment, save: mockSave };
      jest
        .spyOn(scheduleAssignmentModel, 'create')
        .mockResolvedValue(mockInstance as any);
      jest.spyOn(service, 'assign').mockResolvedValue(mockAssignment as any);

      const result = await service.bulkAssign(bulkDto);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should handle partial failures in bulk assign', async () => {
      mockShiftTemplateService.findById.mockResolvedValue(mockShiftTemplate);
      jest.spyOn(service, 'assign').mockImplementation((dto) => {
        if (dto.employeeId === '507f1f77bcf86cd799439012') {
          return Promise.resolve(mockAssignment as any);
        } else {
          return Promise.reject(new ConflictException('Conflict detected'));
        }
      });

      const result = await service.bulkAssign(bulkDto);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should throw BadRequestException when no target provided', async () => {
      const invalidDto = { ...bulkDto, employeeIds: undefined };
      await expect(service.bulkAssign(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when multiple targets provided', async () => {
      const invalidDto = {
        ...bulkDto,
        departmentId: '507f1f77bcf86cd799439016',
      };
      await expect(service.bulkAssign(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('query', () => {
    it('should query assignments with filters', async () => {
      const queryDto: QueryAssignmentsDto = {
        employeeId: '507f1f77bcf86cd799439012',
        from: '2025-01-01T00:00:00.000Z',
        to: '2025-12-31T23:59:59.000Z',
      };

      const mockExec = jest.fn().mockResolvedValue([mockAssignment]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulateChain = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate = jest
        .fn()
        .mockReturnValue({ populate: mockPopulateChain });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      jest
        .spyOn(scheduleAssignmentModel, 'find')
        .mockReturnValue(mockFind as any);

      const result = await service.query(queryDto);

      expect(scheduleAssignmentModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockAssignment]);
    });
  });

  describe('calculateRotationalSchedule', () => {
    it('should calculate rotational schedule correctly', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-10');
      const pattern = '4-on/3-off';

      const result = service.calculateRotationalSchedule(
        startDate,
        endDate,
        pattern,
      );

      expect(result.workDays.length).toBeGreaterThan(0);
      expect(result.restDays.length).toBeGreaterThan(0);
      expect(result.workDays.length + result.restDays.length).toBe(10);
    });

    it('should throw BadRequestException for invalid pattern', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-10');
      const invalidPattern = 'invalid-pattern';

      expect(() => {
        service.calculateRotationalSchedule(startDate, endDate, invalidPattern);
      }).toThrow(BadRequestException);
    });

    it('should handle 4-on/3-off pattern correctly', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07'); // 7 days = one full cycle
      const pattern = '4-on/3-off';

      const result = service.calculateRotationalSchedule(
        startDate,
        endDate,
        pattern,
      );

      expect(result.workDays.length).toBe(4);
      expect(result.restDays.length).toBe(3);
    });
  });
});
