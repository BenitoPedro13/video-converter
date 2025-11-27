import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from './proxy.service';
export declare class ProxyController {
    private proxyService;
    private configService;
    constructor(proxyService: ProxyService, configService: ConfigService);
    authRegister(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    authLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    authValidate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    converterRoutes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    notificationRoutes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private forwardToService;
}
