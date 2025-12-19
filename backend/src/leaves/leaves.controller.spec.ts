import { Test, TestingModule } from '@nestjs/testing';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

describe('LeavesController', () => {
  let controller: LeavesController;
  let service: LeavesService;

  const mockLeavesService = {
    leaveType: {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByCode: jest.fn(),
    },
    leavePolicy: {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    leaveRequest: {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      managerApprove: jest.fn(),
      managerReject: jest.fn(),
    },
    leaveEntitlement: {
      create: jest.fn(),
      findByEmployee: jest.fn(),
      update: jest.fn(),
      removeByEmployee: jest.fn(),
    },
    leaveAdjustment: {
      create: jest.fn(),
      approve: jest.fn(),
    },
    calendar: {
      create: jest.fn(),
      findByYear: jest.fn(),
      update: jest.fn(),
      addBlockedPeriod: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeavesController],
      providers: [{ provide: LeavesService, useValue: mockLeavesService }],
    }).compile();

    controller = module.get<LeavesController>(LeavesController);
    service = module.get<LeavesService>(LeavesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call leaveType.create on createLeaveType', async () => {
    const dto = { code: 'ANL', name: 'Annual Leave' };
    mockLeavesService.leaveType.create.mockResolvedValue(dto);

    const result = await controller.createLeaveType(dto);

    expect(service.leaveType.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(dto);
  });

  it('should call leaveRequest.findAll on findAllRequests', async () => {
    const mock = [];
    mockLeavesService.leaveRequest.findAll.mockResolvedValue(mock);

    const result = await controller.findAllRequests();

    expect(service.leaveRequest.findAll).toHaveBeenCalled();
    expect(result).toBe(mock);
  });
});
