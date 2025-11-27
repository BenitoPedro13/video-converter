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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const proxy_service_1 = require("./proxy.service");
const public_decorator_1 = require("../decorators/public.decorator");
let ProxyController = class ProxyController {
    proxyService;
    configService;
    constructor(proxyService, configService) {
        this.proxyService = proxyService;
        this.configService = configService;
    }
    async authRegister(req, res) {
        return this.forwardToService('AUTH_SERVICE_URL', '/auth/register', req, res);
    }
    async authLogin(req, res) {
        return this.forwardToService('AUTH_SERVICE_URL', '/auth/login', req, res);
    }
    async authValidate(req, res) {
        return this.forwardToService('AUTH_SERVICE_URL', '/auth/validate', req, res);
    }
    async converterRoutes(req, res) {
        const path = req.url.replace('/converter', '');
        return this.forwardToService('CONVERTER_SERVICE_URL', path, req, res);
    }
    async notificationRoutes(req, res) {
        const path = req.url.replace('/notification', '');
        return this.forwardToService('NOTIFICATION_SERVICE_URL', path, req, res);
    }
    async forwardToService(serviceUrlKey, path, req, res) {
        try {
            const serviceUrl = this.configService.get(serviceUrlKey);
            if (!serviceUrl) {
                throw new common_1.HttpException(`Service URL not configured: ${serviceUrlKey}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const targetUrl = `${serviceUrl}${path}`;
            const result = await this.proxyService.forwardRequest(targetUrl, req.method, req.body, req.headers, req.query);
            return res.json(result);
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json(error.data);
            }
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error forwarding request',
                error: error.message,
            });
        }
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.All)('auth/register'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "authRegister", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.All)('auth/login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "authLogin", null);
__decorate([
    (0, common_1.All)('auth/validate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "authValidate", null);
__decorate([
    (0, common_1.All)('converter/*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "converterRoutes", null);
__decorate([
    (0, common_1.All)('notification/*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "notificationRoutes", null);
exports.ProxyController = ProxyController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService,
        config_1.ConfigService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map