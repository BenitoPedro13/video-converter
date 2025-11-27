import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ProxyService {
  constructor(private httpService: HttpService) {}

  async forwardRequest(
    targetUrl: string,
    method: string,
    body?: Record<string, unknown>,
    headers?: Record<string, unknown>,
    queryParams?: Record<string, unknown>,
  ) {
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
      if (error.response) {
        throw error.response;
      }
      throw error;
    }
  }
}
