import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, isAxiosError } from 'axios';

@Injectable()
export class ProxyService {
  constructor(private httpService: HttpService) {}

  async forwardRequest(
    targetUrl: string,
    method: string,
    body?: unknown,
    headers?: Record<string, unknown>,
    queryParams?: Record<string, unknown>,
  ): Promise<unknown> {
    const config: AxiosRequestConfig = {
      method,
      url: targetUrl,
      headers: {
        ...headers,
        // Remove host header to avoid conflicts
        host: undefined,
      },
      params: queryParams,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = body;
    }

    try {
      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      // Re-throw the error to be handled by NestJS exception filters
      if (isAxiosError(error) && error.response) {
        throw new HttpException(
          error.response.data as string | Record<string, unknown>,
          error.response.status,
        );
      }
      throw error;
    }
  }

  async streamRequest(
    targetUrl: string,
    method: string,
    headers?: Record<string, unknown>,
  ): Promise<unknown> {
    const config: AxiosRequestConfig = {
      method,
      url: targetUrl,
      headers: {
        ...headers,
        host: undefined,
      },
      responseType: 'stream',
    };

    try {
      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new HttpException(
          error.response.data as string | Record<string, unknown>,
          error.response.status,
        );
      }
      throw error;
    }
  }
}
