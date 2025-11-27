import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class AuthGuard implements CanActivate {
    private reflector;
    private httpService;
    private configService;
    constructor(reflector: Reflector, httpService: HttpService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
