import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpException,
    UseGuards,
    HttpStatus,
} from '@nestjs/common';
import { RoleplayService, SessionResponse, TurnResponse, HintResponse, CoachingData } from './roleplay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { getAllScenarios } from './scenarios';
import { IsString, IsNotEmpty } from 'class-validator';

// DTOs
class StartSessionDto {
    @IsString()
    @IsNotEmpty()
    scenarioId: string;

    @IsString()
    @IsNotEmpty()
    userLevel: string;
}

class SubmitTurnDto {
    @IsString()
    @IsNotEmpty()
    userMessage: string;
}

@Controller('roleplay')
export class RoleplayController {
    constructor(private readonly roleplayService: RoleplayService) { }

    /**
     * Get all available scenarios
     */
    @Get('scenarios')
    getScenarios() {
        return {
            scenarios: getAllScenarios().map(({ id, scenario }) => ({
                id,
                title: scenario.title,
                context: scenario.context,
                level: scenario.level,
                userRole: scenario.userRole,
                aiRole: scenario.aiRole,
            })),
        };
    }

    @Post('sessions')
    @UseGuards(JwtAuthGuard)
    async startSession(
        @CurrentUser() user: any,
        @Body() dto: StartSessionDto
    ): Promise<SessionResponse> {
        try {
            return await this.roleplayService.startSession({
                ...dto,
                userId: user.id
            });
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to start session',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get a session by ID
     */
    @Get('sessions/:id')
    async getSession(@Param('id') id: string): Promise<SessionResponse> {
        try {
            return await this.roleplayService.getSession(id);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Session not found',
                HttpStatus.NOT_FOUND,
            );
        }
    }

    /**
     * Submit a turn to a session
     */
    @Post('sessions/:id/turn')
    async submitTurn(
        @Param('id') sessionId: string,
        @Body() dto: SubmitTurnDto,
    ): Promise<TurnResponse> {
        try {
            return await this.roleplayService.submitTurn({
                sessionId,
                userMessage: dto.userMessage,
            });
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to submit turn',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get a hint for the current turn (max 1 per turn)
     */
    @Get('sessions/:id/hint')
    async getHint(@Param('id') sessionId: string): Promise<HintResponse> {
        try {
            return await this.roleplayService.getHint(sessionId);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to get hint',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Pause session and enter coaching mode
     */
    @Post('sessions/:id/pause')
    async pauseSession(@Param('id') sessionId: string): Promise<CoachingData> {
        try {
            return await this.roleplayService.pauseSession(sessionId);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to pause session',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Resume session from coaching mode
     */
    @Post('sessions/:id/resume')
    async resumeSession(@Param('id') sessionId: string): Promise<SessionResponse> {
        try {
            return await this.roleplayService.resumeSession(sessionId);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to resume session',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get all sessions for a user
     */
    @Get('users/:userId/sessions')
    async getUserSessions(@Param('userId') userId: string): Promise<SessionResponse[]> {
        try {
            return await this.roleplayService.getUserSessions(userId);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to get sessions',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
