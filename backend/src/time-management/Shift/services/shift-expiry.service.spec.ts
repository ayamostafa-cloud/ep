import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShiftExpiryService } from './shift-expiry.service';
import {
  ShiftExpiryNotification,
  ShiftExpiryNotificationDocument,
} from '../schemas/shift-expiry-notification.schema';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';

describe('ShiftExpiryService', () => {
  let service: ShiftExpiryService;
  let shiftExpiryNotificationModel: Model<ShiftExpiryNotificationDocument>;
  let shiftTemplateModel: Model<ShiftTemplateDocument>;
  let scheduleAssignmentModel: Model<ScheduleAssignmentDocument>;

  const mockNotification = {
    _id: '507f1f77bcf86cd799439030',
    shiftTemplateId: '507f1f77bcf86cd799439011',
    expiryDate: new Date('2025-02-01'),
    notificationSent: false,
    status: 'pending',
  };

  const mockExpiringTemplate = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Expiring Shift',
    expirationDate: new Date('2025-02-01'),
    status: 'Active',
  };

  const mockExpiringAssignment = {
    _id: '507f1f77bcf86cd799439020',
    shiftTemplateId: '507f1f77bcf86cd799439011',
    effectiveTo: new Date('2025-02-01'),
    status: 'Active',
  };

  const mockShiftExpiryNotificationModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockShiftTemplateModel = {
    find: jest.fn(),
  };

  const mockScheduleAssignmentModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftExpiryService,
        {
          provide: getModelToken(ShiftExpiryNotification.name),
          useValue: mockShiftExpiryNotificationModel,
        },
        {
          provide: getModelToken(ShiftTemplate.name),
          useValue: mockShiftTemplateModel,
        },
        {
          provide: getModelToken(ScheduleAssignment.name),
          useValue: mockScheduleAssignmentModel,
        },
      ],
    }).compile();

    service = module.get<ShiftExpiryService>(ShiftExpiryService);
    shiftExpiryNotificationModel = module.get<
      Model<ShiftExpiryNotificationDocument>
    >(getModelToken(ShiftExpiryNotification.name));
    shiftTemplateModel = module.get<Model<ShiftTemplateDocument>>(
      getModelToken(ShiftTemplate.name),
    );
    scheduleAssignmentModel = module.get<Model<ScheduleAssignmentDocument>>(
      getModelToken(ScheduleAssignment.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return all notifications when no status filter', async () => {
      const mockNotifications = [
        mockNotification,
        { ...mockNotification, _id: '507f1f77bcf86cd799439031' },
      ];
      const mockExec = jest.fn().mockResolvedValue(mockNotifications);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulateChain = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate = jest
        .fn()
        .mockReturnValue({ populate: mockPopulateChain });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      jest
        .spyOn(shiftExpiryNotificationModel, 'find')
        .mockReturnValue(mockFind as any);

      const result = await service.getNotifications();

      expect(shiftExpiryNotificationModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockNotifications);
    });

    it('should return filtered notifications by status', async () => {
      const mockExec = jest.fn().mockResolvedValue([mockNotification]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulateChain = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate = jest
        .fn()
        .mockReturnValue({ populate: mockPopulateChain });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      jest
        .spyOn(shiftExpiryNotificationModel, 'find')
        .mockReturnValue(mockFind as any);

      const result = await service.getNotifications('pending');

      expect(shiftExpiryNotificationModel.find).toHaveBeenCalledWith({
        status: 'pending',
      });
      expect(result).toEqual([mockNotification]);
    });
  });

  describe('detectExpiringShifts', () => {
    it('should detect expiring shift templates and create notifications', async () => {
      const today = new Date();
      const daysBeforeExpiry = 30;
      const expiryThreshold = new Date();
      expiryThreshold.setDate(today.getDate() + daysBeforeExpiry);

      const mockExec = jest.fn().mockResolvedValue([mockExpiringTemplate]);
      jest.spyOn(shiftTemplateModel, 'find').mockReturnValue({
        exec: mockExec,
      } as any);
      jest
        .spyOn(shiftExpiryNotificationModel, 'findOne')
        .mockResolvedValue(null);
      jest
        .spyOn(shiftExpiryNotificationModel, 'create')
        .mockResolvedValue(mockNotification as any);

      const mockAssignmentExec = jest.fn().mockResolvedValue([]);
      jest.spyOn(scheduleAssignmentModel, 'find').mockReturnValue({
        exec: mockAssignmentExec,
      } as any);

      const result = await service.detectExpiringShifts(daysBeforeExpiry);

      expect(shiftTemplateModel.find).toHaveBeenCalled();
      expect(shiftExpiryNotificationModel.create).toHaveBeenCalled();
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should detect expiring schedule assignments and create notifications', async () => {
      const today = new Date();
      const daysBeforeExpiry = 30;

      const mockTemplateExec = jest.fn().mockResolvedValue([]);
      jest.spyOn(shiftTemplateModel, 'find').mockReturnValue({
        exec: mockTemplateExec,
      } as any);

      const mockAssignmentExec = jest
        .fn()
        .mockResolvedValue([mockExpiringAssignment]);
      jest.spyOn(scheduleAssignmentModel, 'find').mockReturnValue({
        exec: mockAssignmentExec,
      } as any);
      jest
        .spyOn(shiftExpiryNotificationModel, 'findOne')
        .mockResolvedValue(null);
      jest
        .spyOn(shiftExpiryNotificationModel, 'create')
        .mockResolvedValue(mockNotification as any);

      const result = await service.detectExpiringShifts(daysBeforeExpiry);

      expect(scheduleAssignmentModel.find).toHaveBeenCalled();
      expect(shiftExpiryNotificationModel.create).toHaveBeenCalled();
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should not create duplicate notifications', async () => {
      const today = new Date();
      const daysBeforeExpiry = 30;

      const mockExec = jest.fn().mockResolvedValue([mockExpiringTemplate]);
      jest.spyOn(shiftTemplateModel, 'find').mockReturnValue({
        exec: mockExec,
      } as any);
      jest
        .spyOn(shiftExpiryNotificationModel, 'findOne')
        .mockResolvedValue(mockNotification as any);

      const mockAssignmentExec = jest.fn().mockResolvedValue([]);
      jest.spyOn(scheduleAssignmentModel, 'find').mockReturnValue({
        exec: mockAssignmentExec,
      } as any);

      const result = await service.detectExpiringShifts(daysBeforeExpiry);

      expect(shiftExpiryNotificationModel.create).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('should return count of created notifications', async () => {
      const today = new Date();
      const daysBeforeExpiry = 30;

      const mockExec = jest
        .fn()
        .mockResolvedValue([
          mockExpiringTemplate,
          { ...mockExpiringTemplate, _id: '507f1f77bcf86cd799439012' },
        ]);
      jest.spyOn(shiftTemplateModel, 'find').mockReturnValue({
        exec: mockExec,
      } as any);
      jest
        .spyOn(shiftExpiryNotificationModel, 'findOne')
        .mockResolvedValue(null);
      jest
        .spyOn(shiftExpiryNotificationModel, 'create')
        .mockResolvedValue(mockNotification as any);

      const mockAssignmentExec = jest.fn().mockResolvedValue([]);
      jest.spyOn(scheduleAssignmentModel, 'find').mockReturnValue({
        exec: mockAssignmentExec,
      } as any);

      const result = await service.detectExpiringShifts(daysBeforeExpiry);

      expect(result).toBe(2);
    });
  });
});
