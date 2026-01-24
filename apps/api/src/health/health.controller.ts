import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    async check() {
        return this.healthService.check();
    }

    @Get('db')
    async checkDatabase() {
        return this.healthService.checkDatabase();
    }

    @Get('redis')
    async checkRedis() {
        return this.healthService.checkRedis();
    }

    @Get('detailed')
    async checkDetailed() {
        return this.healthService.checkDetailed();
    }
}
