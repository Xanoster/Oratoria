import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;

    const mockAuthService = {
        signUp: jest.fn(),
        login: jest.fn(),
        sendMagicLink: jest.fn(),
        verifyMagicLink: jest.fn(),
        refreshToken: jest.fn(),
    };

    const mockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('signUp', () => {
        it('should create a new user', async () => {
            const signUpDto = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };
            const result = { userId: '123', email: signUpDto.email };
            mockAuthService.signUp.mockResolvedValue(result);

            const mockRes = {
                cookie: jest.fn(),
            } as any;
            expect(await controller.signUp(signUpDto, mockRes)).toEqual(result);
            expect(mockRes.cookie).toHaveBeenCalled();
            expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto);
        });
    });

    describe('login', () => {
        it('should login user and set cookies', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            const result = {
                userId: '123',
                email: loginDto.email,
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            };
            mockAuthService.login.mockResolvedValue(result);

            const response = await controller.login(loginDto, mockResponse as any);

            expect(response).toEqual({
                userId: result.userId,
                email: result.email,
            });
            expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
        });
    });

    describe('logout', () => {
        it('should clear cookies', async () => {
            const response = await controller.logout(mockResponse as any);

            expect(response).toEqual({ success: true });
            expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
            expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
        });
    });

    describe('me', () => {
        it('should return current user info', async () => {
            const user = { id: '123', email: 'test@example.com' };

            const result = await controller.me(user);

            expect(result).toEqual({ userId: user.id, email: user.email });
        });
    });
});
