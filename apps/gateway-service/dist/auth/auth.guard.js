"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const public_decorator_1 = require("../decorators/public.decorator");
const rxjs_1 = require("rxjs");
let AuthGuard = class AuthGuard {
    reflector;
    httpService;
    configService;
    constructor(reflector, httpService, configService) {
        this.reflector = reflector;
        this.httpService = httpService;
        this.configService = configService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            throw new common_1.UnauthorizedException('No authorization header provided');
        }
        try {
            const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${authServiceUrl}/auth/validate`, {
                headers: {
                    authorization: authHeader,
                },
            }));
            request.user = response.data;
            return true;
        }
        catch (error) {
            throw new common_1.UnauthorizedException(error, 'Invalid or expired token');
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        axios_1.HttpService,
        config_1.ConfigService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map