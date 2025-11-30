import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

export const jwtFactory = (configService: ConfigService): JwtModuleOptions => {
  const secret = configService.get<string>('JWT_SECRET');
  const expiresIn =
    configService.get<JwtSignOptions['expiresIn']>('JWT_EXPIRATION') || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return {
    secret,
    signOptions: { expiresIn },
  };
};
