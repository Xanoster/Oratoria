import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AdaptiveLearningService, SessionPlan, LearningContext } from './adaptive-learning.service';

class GetSessionPlanDto {
    timeAvailable?: number; // minutes, defaults to 15
}

@Controller('adaptive-learning')
export class AdaptiveLearningController {
    constructor(private readonly adaptiveService: AdaptiveLearningService) { }

    /**
     * Get next session plan for a user
     * Returns what the user should study next based on their performance
     */
    @Get('next-session/:userId')
    async getNextSession(
        @Param('userId') userId: string,
        @Query('time') time?: string,
    ): Promise<SessionPlan> {
        const timeAvailable = time ? parseInt(time, 10) : 15;
        const context = await this.adaptiveService.getLearningContext(userId, timeAvailable);
        return this.adaptiveService.decideNextSession(context);
    }

    /**
     * Get session plan with custom context (for testing/advanced use)
     */
    @Post('decide')
    async decideSession(@Body() context: LearningContext): Promise<SessionPlan> {
        return this.adaptiveService.decideNextSession(context);
    }
}
