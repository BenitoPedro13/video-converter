import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';

import { AuthenticatedRequest } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };
  let mockHttpService: { get: jest.Mock };
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    mockHttpService = {
      get: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let request: AuthenticatedRequest;

    beforeEach(() => {
      request = {
        headers: {},
      } as AuthenticatedRequest;
      context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;
    });

    it('should return true if route is public', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no auth header', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return true and attach user if token is valid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      request.headers['authorization'] = 'Bearer valid_token';
      mockConfigService.get.mockReturnValue('http://auth-service');

      const user = { id: '1', email: 'test@example.com' };
      const response: AxiosResponse = {
        data: user,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };

      mockHttpService.get.mockReturnValue(of(response));

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(user);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://auth-service/auth/validate',
        {
          headers: { authorization: 'Bearer valid_token' },
        },
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      request.headers['authorization'] = 'Bearer invalid_token';
      mockConfigService.get.mockReturnValue('http://auth-service');

      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Invalid token')),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
