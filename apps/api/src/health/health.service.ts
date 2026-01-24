import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
}

export interface ServiceHealth {
    status: 'ok' | 'error';
    latency?: number;
    error?: string;
}

export interface DetailedHealth extends HealthStatus {
    services: {
        database: ServiceHealth;
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

    async checkDetailed(): Promise<DetailedHealth> {
        const database = await this.checkDatabase();

        return {
            status: database.status === 'ok' ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            services: {
                database,
            },
        };
    }
}
