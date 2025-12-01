import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const result = {
        access_token: 'token',
        user: { id: '1', ...dto },
      };

      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(dto)).toBe(result);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      const result = {
        access_token: 'token',
        user: { id: '1', ...dto, name: 'Test User' },
      };

      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(dto)).toBe(result);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('validate', () => {
    it('should validate token', async () => {
      const token = 'valid_token';
      const authorization = `Bearer ${token}`;
      const result = { id: '1', email: 'test@example.com', name: 'Test User' };

      mockAuthService.validateToken.mockResolvedValue(result);

      expect(await controller.validate(authorization)).toBe(result);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException if no token provided', async () => {
      await expect(controller.validate('')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
