import { HttpService } from '@nestjs/axios';
export declare class ProxyService {
    private httpService;
    constructor(httpService: HttpService);
    forwardRequest(targetUrl: string, method: string, body?: Record<string, unknown>, headers?: Record<string, unknown>, queryParams?: Record<string, unknown>): Promise<any>;
}
