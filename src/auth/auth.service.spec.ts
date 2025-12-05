import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should create new user if not exists', async () => {
      const loginDto = { username: 'newuser', password: 'password123' };
      const newUser = {
        id: '1',
        username: 'newuser',
        password: 'hashed',
        role: UserRole.SURVIVOR,
      };
      const token = 'jwt_token';

      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
      });
      expect(mockUsersService.create).toHaveBeenCalledWith(loginDto);
    });

    it('should login existing user with valid password', async () => {
      const loginDto = { username: 'existing', password: 'password123' };
      const existingUser = {
        id: '1',
        username: 'existing',
        password: 'hashed',
        role: UserRole.SURVIVOR,
      };
      const token = 'jwt_token';

      mockUsersService.findByUsername.mockResolvedValue(existingUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          role: existingUser.role,
        },
      });
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith('password123', 'hashed');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = { username: 'existing', password: 'wrong' };
      const existingUser = {
        id: '1',
        username: 'existing',
        password: 'hashed',
        role: UserRole.SURVIVOR,
      };

      mockUsersService.findByUsername.mockResolvedValue(existingUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
