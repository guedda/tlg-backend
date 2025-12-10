import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoundsService } from './rounds.service';
import { PrismaService } from '../prisma.service';
import { RoundStatus } from './types/round-status.enum';
import { UserRole } from '@prisma/client';

describe('RoundsService', () => {
  let service: RoundsService;

  const mockPrismaService = {
    round: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        COOLDOWN_DURATION: 30,
        ROUND_DURATION: 60,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RoundsService>(RoundsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a round with correct dates', async () => {
      const now = new Date('2025-01-01T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockRound = {
        id: '1',
        startDate: new Date(now.getTime() + 30 * 1000),
        endDate: new Date(now.getTime() + 90 * 1000),
        createdAt: now,
      };

      mockPrismaService.round.create.mockResolvedValue(mockRound);

      const result = await service.create();

      expect(result).toEqual(mockRound);
      expect(mockPrismaService.round.create).toHaveBeenCalled();
      const createCall = mockPrismaService.round.create.mock.calls[0][0];
      expect(createCall.data.startDate.getTime()).toBe(now.getTime() + 30 * 1000);
      expect(createCall.data.endDate.getTime()).toBe(now.getTime() + 90 * 1000);

      jest.useRealTimers();
    });
  });

  describe('getRoundStatus', () => {
    it('should return COOLDOWN if current time is before start', () => {
      const round = {
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
      };

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T11:59:00Z'));

      const status = service.getRoundStatus(round);
      expect(status).toBe(RoundStatus.COOLDOWN);

      jest.useRealTimers();
    });

    it('should return ACTIVE if current time is between start and end', () => {
      const round = {
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
      };

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T12:00:30Z'));

      const status = service.getRoundStatus(round);
      expect(status).toBe(RoundStatus.ACTIVE);

      jest.useRealTimers();
    });

    it('should return FINISHED if current time is after end', () => {
      const round = {
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
      };

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T12:02:00Z'));

      const status = service.getRoundStatus(round);
      expect(status).toBe(RoundStatus.FINISHED);

      jest.useRealTimers();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if round not found', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return formatted round with user score', async () => {
      const round = {
        id: '1',
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
        createdAt: new Date('2025-01-01T11:59:00Z'),
        taps: [
          {
            id: 'tap1',
            userId: 'user1',
            roundId: '1',
            user: { id: 'user1', username: 'testuser', role: UserRole.SURVIVOR },
          },
        ],
      };

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T12:00:30Z'));

      mockPrismaService.round.findUnique.mockResolvedValue(round);

      const result = await service.findOne('1', 'user1');

      expect(result.id).toBe('1');
      expect(result.status).toBe(RoundStatus.ACTIVE);
      expect(result.userScore).toBe(1);

      jest.useRealTimers();
    });
  });
});
