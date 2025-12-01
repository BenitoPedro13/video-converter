import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from './proxy.service';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';

describe('ProxyService', () => {
  let service: ProxyService;
  let mockHttpService: { request: jest.Mock };

  beforeEach(async () => {
    mockHttpService = {
      request: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forwardRequest', () => {
    it('should forward request and return data', async () => {
      const targetUrl = 'http://service/path';
      const method = 'POST';
      const body = { key: 'value' };
      const headers = { authorization: 'token' };
      const queryParams = { q: 'search' };
      const responseData = { success: true };

      const response: AxiosResponse = {
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };

      mockHttpService.request.mockReturnValue(of(response));

      const result = await service.forwardRequest(
        targetUrl,
        method,
        body,
        headers,
        queryParams,
      );

      expect(result).toEqual(responseData);
      expect(mockHttpService.request).toHaveBeenCalledWith({
        method,
        url: targetUrl,
        headers: { ...headers, host: undefined },
        params: queryParams,
        data: body,
      });
    });

    it('should throw HttpException if axios error with response', async () => {
      const errorResponse = { message: 'Bad Request' };
      const error = {
        isAxiosError: true,
        response: {
          data: errorResponse,
          status: 400,
        },
      };

      mockHttpService.request.mockReturnValue(throwError(() => error));

      await expect(service.forwardRequest('url', 'GET')).rejects.toThrow(
        HttpException,
      );
    });

    it('should re-throw other errors', async () => {
      const error = new Error('Network Error');

      mockHttpService.request.mockReturnValue(throwError(() => error));

      await expect(service.forwardRequest('url', 'GET')).rejects.toThrow(error);
    });
  });
});
