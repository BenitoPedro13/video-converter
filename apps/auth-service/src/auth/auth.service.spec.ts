import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const hashedPassword = 'hashedPassword';
      const user = { id: '1', ...dto, password: hashedPassword };
      const token = 'access_token';

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.register(dto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    });

    it('should throw UnauthorizedException if user already exists', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const user = { id: '1', ...dto };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.register(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      const user = {
        id: '1',
        email: dto.email,
        password: 'hashedPassword',
        name: 'Test User',
      };
      const token = 'access_token';

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.login(dto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(result).toEqual({
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dto = { email: 'test@example.com', password: 'password' };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      const user = {
        id: '1',
        email: dto.email,
        password: 'hashedPassword',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('should return user if token is valid', async () => {
      const token = 'valid_token';
      const payload = { sub: '1', email: 'test@example.com' };
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateToken(token);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true },
      });
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const token = 'invalid_token';

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const token = 'valid_token';
      const payload = { sub: '1', email: 'test@example.com' };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
