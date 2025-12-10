import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TapsService } from './taps.service';
import { PrismaService } from '../prisma.service';
import { RoundsService } from '../rounds/rounds.service';
import { UserRole } from '@prisma/client';

describe('TapsService', () => {
  let service: TapsService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    round: {
      findUnique: jest.fn(),
    },
    tap: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockRoundsService = {
    isRoundActive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TapsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RoundsService,
          useValue: mockRoundsService,
        },
      ],
    }).compile();

    service = module.get<TapsService>(TapsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tap', () => {
    it('should create tap and return score for survivor', async () => {
      const now = new Date('2025-01-01T12:00:30Z');
      const round = {
        id: 'round1',
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
      };

      const tap = {
        id: 'tap1',
        userId: 'user1',
        roundId: 'round1',
        createdAt: now,
      };

      const userTaps = [tap];

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const tx = {
          round: {
            findUnique: jest.fn().mockResolvedValue(round),
          },
          tap: {
            create: jest.fn().mockResolvedValue(tap),
            findMany: jest.fn().mockResolvedValue(userTaps),
          },
        };
        return callback(tx);
      });

      const result = await service.tap('round1', { id: 'user1', role: UserRole.SURVIVOR });

      expect(result.tapId).toBe('tap1');
      expect(result.totalTaps).toBe(1);
      expect(result.score).toBe(1);
    });

    it('should return 0 score for nikita user', async () => {
      const now = new Date('2025-01-01T12:00:30Z');
      const round = {
        id: 'round1',
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
      };

      const tap = {
        id: 'tap1',
        userId: 'nikita',
        roundId: 'round1',
        createdAt: now,
      };

      const userTaps = [tap];

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const tx = {
          round: {
            findUnique: jest.fn().mockResolvedValue(round),
          },
          tap: {
            create: jest.fn().mockResolvedValue(tap),
            findMany: jest.fn().mockResolvedValue(userTaps),
          },
        };
        return callback(tx);
      });

      const result = await service.tap('round1', { id: 'nikita', role: UserRole.NIKITA });

      expect(result.score).toBe(0);
    });

    it('should calculate bonus for 11th tap', async () => {
      const now = new Date('2025-01-01T12:00:30Z');
      const round = {
        id: 'round1',
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
      };

      const userTaps = Array.from({ length: 11 }, (_, i) => ({
        id: `tap${i + 1}`,
        userId: 'user1',
        roundId: 'round1',
        createdAt: new Date(now.getTime() + i * 1000),
      }));

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const tx = {
          round: {
            findUnique: jest.fn().mockResolvedValue(round),
          },
          tap: {
            create: jest.fn().mockResolvedValue(userTaps[10]),
            findMany: jest.fn().mockResolvedValue(userTaps),
          },
        };
        return callback(tx);
      });

      const result = await service.tap('round1', { id: 'user1', role: UserRole.SURVIVOR });

      expect(result.totalTaps).toBe(11);
      expect(result.score).toBe(20); // 10 regular taps (10 points) + 1 bonus tap (10 points)
    });

    it('should throw NotFoundException if round not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const tx = {
          round: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(
        service.tap('nonexistent', { id: 'user1', role: UserRole.SURVIVOR }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if round not started', async () => {
      const round = {
        id: 'round1',
        startDate: new Date('2025-01-01T12:01:00Z'),
        endDate: new Date('2025-01-01T12:02:00Z'),
      };

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const tx = {
          round: {
            findUnique: jest.fn().mockResolvedValue(round),
          },
        };
        return callback(tx);
      });

      await expect(service.tap('round1', { id: 'user1', role: UserRole.SURVIVOR })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if round finished', async () => {
      const round = {
        id: 'round1',
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2025-01-01T12:01:00Z'),
      };

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const tx = {
          round: {
            findUnique: jest.fn().mockResolvedValue(round),
          },
        };
        return callback(tx);
      });

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T12:02:00Z'));

      await expect(service.tap('round1', { id: 'user1', role: UserRole.SURVIVOR })).rejects.toThrow(
        BadRequestException,
      );

      jest.useRealTimers();
    });
  });
});
