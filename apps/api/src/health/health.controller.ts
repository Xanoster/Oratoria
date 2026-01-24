import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthStatus, ServiceHealth, DetailedHealth } from './health.service';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    async check(): Promise<HealthStatus> {
        return this.healthService.check();
    }

    @Get('db')
    async checkDatabase(): Promise<ServiceHealth> {
        return this.healthService.checkDatabase();
    }

    @Get('detailed')
    async checkDetailed(): Promise<DetailedHealth> {
        return this.healthService.checkDetailed();
    }
}
