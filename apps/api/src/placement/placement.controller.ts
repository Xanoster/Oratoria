import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PlacementService } from './placement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('placement')
@UseGuards(JwtAuthGuard)
export class PlacementController {
    constructor(private placementService: PlacementService) { }

    @Post('start')
    async startPlacement(@CurrentUser() user: any) {
        return this.placementService.startPlacement(user.id);
    }

    @Post(':sessionId/submit')
    async submitAudio(
        @Param('sessionId') sessionId: string,
        @Body() data: { promptId: string; transcript: string },
    ) {
        return this.placementService.submitAudio(sessionId, data.promptId, data.transcript);
    }

    @Get(':sessionId/result')
    async getResult(@Param('sessionId') sessionId: string) {
        return this.placementService.getResult(sessionId);
    }
}
