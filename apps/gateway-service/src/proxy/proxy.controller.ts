import {
  All,
  Controller,
  Req,
  Res,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { Public } from '../decorators/public.decorator';

@Controller()
export class ProxyController {
  constructor(
    private proxyService: ProxyService,
    private configService: ConfigService,
  ) {}

  // Auth service routes (public)
  @Public()
  @All('auth/register')
  async authRegister(@Req() req: Request, @Res() res: Response) {
    return this.forwardToService(
      'AUTH_SERVICE_URL',
      '/auth/register',
      req,
      res,
    );
  }

  @Public()
  @All('auth/login')
  async authLogin(@Req() req: Request, @Res() res: Response) {
    return this.forwardToService('AUTH_SERVICE_URL', '/auth/login', req, res);
  }

  // Auth validate route (protected - used by auth guard)
  @All('auth/validate')
  async authValidate(@Req() req: Request, @Res() res: Response) {
    return this.forwardToService(
      'AUTH_SERVICE_URL',
      '/auth/validate',
      req,
      res,
    );
  }

  // Converter service routes (protected)
  @Get('converter/download/:filename')
  async downloadFile(@Req() req: Request, @Res() res: Response) {
    const path = req.url.replace('/converter', '');
    const serviceUrl = this.configService.get<string>('CONVERTER_SERVICE_URL');
    if (!serviceUrl) {
      throw new HttpException(
        'Service URL not configured: CONVERTER_SERVICE_URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const targetUrl = `${serviceUrl}${path}`;

    try {
      const stream = (await this.proxyService.streamRequest(
        targetUrl,
        req.method,
        req.headers as Record<string, unknown>,
      )) as NodeJS.ReadableStream;

      stream.pipe(res);
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).json(error.getResponse());
      }
      // Error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: errorMessage });
    }
  }

  @All('converter/*')
  async converterRoutes(@Req() req: Request, @Res() res: Response) {
    const path = req.url.replace('/converter', '');
    const contentType = req.headers['content-type'];
    const body: unknown =
      contentType && contentType.includes('multipart/form-data')
        ? req
        : req.body;

    return this.forwardToService('CONVERTER_SERVICE_URL', path, req, res, body);
  }

  // Notification service routes (protected)
  @All('notification/*')
  async notificationRoutes(@Req() req: Request, @Res() res: Response) {
    const path = req.url.replace('/notification', '');
    return this.forwardToService('NOTIFICATION_SERVICE_URL', path, req, res);
  }

  private async forwardToService(
    serviceUrlKey: string,
    path: string,
    req: Request,
    res: Response,
    body?: unknown,
  ) {
    try {
      const serviceUrl = this.configService.get<string>(serviceUrlKey);

      if (!serviceUrl) {
        throw new HttpException(
          `Service URL not configured: ${serviceUrlKey}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const targetUrl = `${serviceUrl}${path}`;

      const result = await this.proxyService.forwardRequest(
        targetUrl,
        req.method,
        body || req.body,
        req.headers as Record<string, unknown>,
        req.query as Record<string, unknown>,
      );

      return res.json(result);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).json(error.getResponse());
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error forwarding request',
        error: errorMessage,
      });
    }
  }
}
