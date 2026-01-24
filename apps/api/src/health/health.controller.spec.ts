import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
    let controller: HealthController;
    let service: HealthService;

    const mockHealthService = {
        check: jest.fn(),
        checkDatabase: jest.fn(),
        checkRedis: jest.fn(),
        checkDetailed: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: HealthService,
                    useValue: mockHealthService,
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        service = module.get<HealthService>(HealthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('check', () => {
        it('should return health status', async () => {
            const result = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: 100,
            };
            mockHealthService.check.mockResolvedValue(result);

            expect(await controller.check()).toEqual(result);
            expect(mockHealthService.check).toHaveBeenCalled();
        });
    });

    describe('checkDatabase', () => {
        it('should return database health status', async () => {
            const result = { status: 'ok', latency: 5 };
            mockHealthService.checkDatabase.mockResolvedValue(result);

            expect(await controller.checkDatabase()).toEqual(result);
            expect(mockHealthService.checkDatabase).toHaveBeenCalled();
        });

        it('should return error status when database is down', async () => {
            const result = { status: 'error', error: 'Connection refused' };
            mockHealthService.checkDatabase.mockResolvedValue(result);

            expect(await controller.checkDatabase()).toEqual(result);
        });
    });

    describe('checkDetailed', () => {
        it('should return detailed health status', async () => {
            const result = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: 100,
                services: {
                    database: { status: 'ok', latency: 5 },
                    redis: { status: 'ok', latency: 1 },
                },
            };
            mockHealthService.checkDetailed.mockResolvedValue(result);

            expect(await controller.checkDetailed()).toEqual(result);
        });
    });
});
