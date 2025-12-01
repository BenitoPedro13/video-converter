import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { firstValueFrom } from 'rxjs';

import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    let authHeader = request.headers['authorization'];

    // If no header, check query param (useful for downloads)
    if (!authHeader && typeof request.query.token === 'string') {
      authHeader = `Bearer ${request.query.token}`;
    }

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    try {
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');

      // Call auth-service to validate token
      const response = await firstValueFrom(
        this.httpService.get(`${authServiceUrl}/auth/validate`, {
          headers: {
            authorization: authHeader,
          },
        }),
      );

      // Attach user data to request
      request.user = response.data as Record<string, unknown>;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
}
