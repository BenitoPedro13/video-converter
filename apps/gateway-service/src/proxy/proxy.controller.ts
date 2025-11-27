import {
  All,
  Controller,
  Req,
  Res,
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
  @All('converter/*')
  async converterRoutes(@Req() req: Request, @Res() res: Response) {
    const path = req.url.replace('/converter', '');
    return this.forwardToService('CONVERTER_SERVICE_URL', path, req, res);
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
        req.body,
        req.headers,
        req.query,
      );

      return res.json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json(error.data);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error forwarding request',
        error: error.message,
      });
    }
  }
}
