import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProxyController', () => {
  let controller: ProxyController;
  let mockProxyService: { forwardRequest: jest.Mock };
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockProxyService = {
      forwardRequest: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: mockProxyService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('forwardToService', () => {
    let req: Request;
    let res: Response;

    beforeEach(() => {
      req = {
        method: 'POST',
        body: {},
        headers: {},
        query: {},
        url: '/auth/login',
      } as unknown as Request;
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
    });

    it('should forward request to configured service', async () => {
      const serviceUrl = 'http://auth-service';
      const result = { success: true };

      mockConfigService.get.mockReturnValue(serviceUrl);
      mockProxyService.forwardRequest.mockResolvedValue(result);

      await controller.authLogin(req, res);

      expect(mockConfigService.get).toHaveBeenCalledWith('AUTH_SERVICE_URL');
      expect(mockProxyService.forwardRequest).toHaveBeenCalledWith(
        `${serviceUrl}/auth/login`,
        req.method,
        req.body,
        req.headers,
        req.query,
      );
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should handle HttpException from proxy service', async () => {
      const serviceUrl = 'http://auth-service';
      const errorResponse = { message: 'Bad Request' };
      const error = new HttpException(errorResponse, HttpStatus.BAD_REQUEST);

      mockConfigService.get.mockReturnValue(serviceUrl);
      mockProxyService.forwardRequest.mockRejectedValue(error);

      await controller.authLogin(req, res);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(
        HttpStatus.BAD_REQUEST,
      );
      expect(res.json).toHaveBeenCalledWith(errorResponse);
    });

    it('should handle unknown errors', async () => {
      const serviceUrl = 'http://auth-service';
      const error = new Error('Unknown error');

      mockConfigService.get.mockReturnValue(serviceUrl);
      mockProxyService.forwardRequest.mockRejectedValue(error);

      await controller.authLogin(req, res);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error forwarding request',
        error: error.message,
      });
    });

    it('should return 500 if service URL is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await controller.authLogin(req, res);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith(
        'Service URL not configured: AUTH_SERVICE_URL',
      );
    });
  });
});

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}
