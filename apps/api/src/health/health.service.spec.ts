import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
    let service: HealthService;
    let prisma: PrismaService;

    const mockPrismaService = {
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HealthService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<HealthService>(HealthService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('check', () => {
        it('should return ok status with uptime', async () => {
            const result = await service.check();

            expect(result.status).toBe('ok');
            expect(result.timestamp).toBeDefined();
            expect(result.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('checkDatabase', () => {
        it('should return ok when database is reachable', async () => {
            mockPrismaService.$queryRaw.mockResolvedValue([{ '1': 1 }]);

            const result = await service.checkDatabase();

            expect(result.status).toBe('ok');
            expect(result.latency).toBeDefined();
        });

        it('should return error when database query fails', async () => {
            mockPrismaService.$queryRaw.mockRejectedValue(
                new Error('Connection refused'),
            );

            const result = await service.checkDatabase();

            expect(result.status).toBe('error');
            expect(result.error).toBe('Connection refused');
        });
    });

    describe('checkDetailed', () => {
        it('should return all service statuses', async () => {
            mockPrismaService.$queryRaw.mockResolvedValue([{ '1': 1 }]);

            const result = await service.checkDetailed();

            expect(result.status).toBeDefined();
            expect(result.services.database).toBeDefined();
        });

        it('should return error status when database is down', async () => {
            mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB down'));

            const result = await service.checkDetailed();

            expect(result.status).toBe('error');
            expect(result.services.database.status).toBe('error');
        });
    });
});
