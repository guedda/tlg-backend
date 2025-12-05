import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: 'hashed',
        role: UserRole.SURVIVOR,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create survivor user by default', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: hashedPassword,
        role: UserRole.SURVIVOR,
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(loginDto);

      expect(result).toEqual(mockUser);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: hashedPassword,
          role: UserRole.SURVIVOR,
        },
      });
    });

    it('should create admin user if username is admin', async () => {
      const loginDto = { username: 'admin', password: 'password123' };
      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: '1',
        username: 'admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create(loginDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });
    });

    it('should create nikita user if username is Никита', async () => {
      const loginDto = { username: 'Никита', password: 'password123' };
      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: '1',
        username: 'Никита',
        password: hashedPassword,
        role: UserRole.NIKITA,
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create(loginDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'Никита',
          password: hashedPassword,
          role: UserRole.NIKITA,
        },
      });
    });

    it('should create nikita user if username is nikita', async () => {
      const loginDto = { username: 'nikita', password: 'password123' };
      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: '1',
        username: 'nikita',
        password: hashedPassword,
        role: UserRole.NIKITA,
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create(loginDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'nikita',
          password: hashedPassword,
          role: UserRole.NIKITA,
        },
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validatePassword('password123', 'hashed');

      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
    });

    it('should return false for invalid password', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validatePassword('wrong', 'hashed');

      expect(result).toBe(false);
    });
  });
});
