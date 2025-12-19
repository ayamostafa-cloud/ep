import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ShiftTemplateService } from './shift-template.service';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';
import { CreateShiftTemplateDto } from '../dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from '../dto/update-shift-template.dto';

describe('ShiftTemplateService', () => {
  let service: ShiftTemplateService;
  let shiftTemplateModel: Model<ShiftTemplateDocument>;
  let scheduleAssignmentModel: Model<ScheduleAssignmentDocument>;

  const mockShiftTemplate = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Normal Shift',
    type: 'normal',
    startTime: '09:00',
    endTime: '17:00',
    restDays: ['Saturday', 'Sunday'],
    gracePeriod: 15,
    isOvernight: false,
    status: 'Active',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockShiftTemplateModel = {
    new: jest.fn().mockResolvedValue(mockShiftTemplate),
    constructor: jest.fn().mockResolvedValue(mockShiftTemplate),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockScheduleAssignmentModel = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftTemplateService,
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

    service = module.get<ShiftTemplateService>(ShiftTemplateService);
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

  describe('create', () => {
    it('should create a new shift template', async () => {
      const createDto: CreateShiftTemplateDto = {
        name: 'Normal Shift',
        type: 'normal',
        startTime: '09:00',
        endTime: '17:00',
        restDays: ['Saturday', 'Sunday'],
        gracePeriod: 15,
        isOvernight: false,
        status: 'Active',
      };

      const mockSave = jest.fn().mockResolvedValue(mockShiftTemplate);
      const mockInstance = { ...mockShiftTemplate, save: mockSave };
      jest
        .spyOn(shiftTemplateModel, 'create')
        .mockResolvedValue(mockInstance as any);

      const result = await service.create(createDto);

      expect(shiftTemplateModel.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockInstance);
    });
  });

  describe('findAll', () => {
    it('should return all shift templates', async () => {
      const mockTemplates = [
        mockShiftTemplate,
        { ...mockShiftTemplate, _id: '507f1f77bcf86cd799439012' },
      ];
      const mockExec = jest.fn().mockResolvedValue(mockTemplates);
      jest.spyOn(shiftTemplateModel, 'find').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.findAll();

      expect(shiftTemplateModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('findById', () => {
    it('should return a shift template by ID', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockShiftTemplate);
      jest.spyOn(shiftTemplateModel, 'findById').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(shiftTemplateModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockShiftTemplate);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(shiftTemplateModel, 'findById').mockReturnValue({
        exec: mockExec,
      } as any);

      await expect(
        service.findById('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a shift template', async () => {
      const updateDto: UpdateShiftTemplateDto = {
        name: 'Updated Shift',
      };
      const updatedTemplate = { ...mockShiftTemplate, name: 'Updated Shift' };
      const mockExec = jest.fn().mockResolvedValue(updatedTemplate);
      jest.spyOn(shiftTemplateModel, 'findByIdAndUpdate').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(shiftTemplateModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $set: updateDto },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedTemplate);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.update('invalid-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(shiftTemplateModel, 'findByIdAndUpdate').mockReturnValue({
        exec: mockExec,
      } as any);

      await expect(
        service.update('507f1f77bcf86cd799439011', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a shift template', async () => {
      jest.spyOn(scheduleAssignmentModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      } as any);
      const mockExec = jest.fn().mockResolvedValue(mockShiftTemplate);
      jest.spyOn(shiftTemplateModel, 'findByIdAndDelete').mockReturnValue({
        exec: mockExec,
      } as any);

      await service.delete('507f1f77bcf86cd799439011');

      expect(scheduleAssignmentModel.countDocuments).toHaveBeenCalled();
      expect(shiftTemplateModel.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.delete('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when template has active assignments', async () => {
      jest.spyOn(scheduleAssignmentModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      } as any);

      await expect(service.delete('507f1f77bcf86cd799439011')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      jest.spyOn(scheduleAssignmentModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      } as any);
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(shiftTemplateModel, 'findByIdAndDelete').mockReturnValue({
        exec: mockExec,
      } as any);

      await expect(service.delete('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
