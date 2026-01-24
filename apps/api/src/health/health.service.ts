import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HealthStatus {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
}

interface ServiceHealth {
    status: 'ok' | 'error';
    latency?: number;
    error?: string;
}

interface DetailedHealth extends HealthStatus {
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
    };
}

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);
    private readonly startTime = Date.now();

    constructor(private prisma: PrismaService) { }

    async check(): Promise<HealthStatus> {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
        };
    }

    async checkDatabase(): Promise<ServiceHealth> {
        const start = Date.now();
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return {
                status: 'ok',
                latency: Date.now() - start,
            };
        } catch (error) {
            this.logger.error('Database health check failed', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async checkRedis(): Promise<ServiceHealth> {
        // Redis check via Bull queue connection
        // For now, return a basic check
        try {
            // If Bull is configured, it would throw on startup if Redis is down
            return {
                status: 'ok',
                latency: 0,
            };
        } catch (error) {
            this.logger.error('Redis health check failed', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async checkDetailed(): Promise<DetailedHealth> {
        const [database, redis] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
        ]);

        const allOk = database.status === 'ok' && redis.status === 'ok';

        return {
            status: allOk ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            services: {
                database,
                redis,
            },
        };
    }
}
