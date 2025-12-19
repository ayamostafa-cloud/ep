import { Test, TestingModule } from '@nestjs/testing';
import { ShiftExpirySchedulerService } from './shift-expiry-scheduler.service';
import { ShiftExpiryService } from './shift-expiry.service';

describe('ShiftExpirySchedulerService', () => {
  let service: ShiftExpirySchedulerService;
  let shiftExpiryService: ShiftExpiryService;

  const mockShiftExpiryService = {
    detectExpiringShifts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftExpirySchedulerService,
        {
          provide: ShiftExpiryService,
          useValue: mockShiftExpiryService,
        },
      ],
    }).compile();

    service = module.get<ShiftExpirySchedulerService>(
      ShiftExpirySchedulerService,
    );
    shiftExpiryService = module.get<ShiftExpiryService>(ShiftExpiryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleExpiringShifts', () => {
    it('should call detectExpiringShifts and log results', async () => {
      mockShiftExpiryService.detectExpiringShifts.mockResolvedValue(5);

      await service.handleExpiringShifts();

      expect(mockShiftExpiryService.detectExpiringShifts).toHaveBeenCalledWith(
        30,
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      mockShiftExpiryService.detectExpiringShifts.mockRejectedValue(error);

      // Should not throw
      await expect(service.handleExpiringShifts()).resolves.not.toThrow();
    });
  });

  describe('triggerExpiryDetection', () => {
    it('should trigger expiry detection with custom days', async () => {
      mockShiftExpiryService.detectExpiringShifts.mockResolvedValue(3);

      const result = await service.triggerExpiryDetection(15);

      expect(mockShiftExpiryService.detectExpiringShifts).toHaveBeenCalledWith(
        15,
      );
      expect(result).toBe(3);
    });
  });
});
