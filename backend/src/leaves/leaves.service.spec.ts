import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LeavesService } from './leaves.service';

describe('LeavesService', () => {
  let service: LeavesService;

  const mockModel = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    exec: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesService,

        { provide: getModelToken('LeaveType'), useFactory: mockModel },
        { provide: getModelToken('LeaveCategory'), useFactory: mockModel },
        { provide: getModelToken('LeavePolicy'), useFactory: mockModel },
        { provide: getModelToken('LeaveRequest'), useFactory: mockModel },
        { provide: getModelToken('Attachment'), useFactory: mockModel },
        { provide: getModelToken('LeaveEntitlement'), useFactory: mockModel },
        { provide: getModelToken('LeaveAdjustment'), useFactory: mockModel },
        { provide: getModelToken('Calendar'), useFactory: mockModel },
      ],
    }).compile();

    service = module.get<LeavesService>(LeavesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
