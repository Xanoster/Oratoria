import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SrsService } from './srs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('srs')
@UseGuards(JwtAuthGuard)
export class SrsController {
    constructor(private srsService: SrsService) { }

    @Get('queue')
    async getQueue(@CurrentUser() user: any) {
        return this.srsService.getQueue(user.id);
    }

    @Post('response')
    async submitResponse(
        @CurrentUser() user: any,
        @Body() data: { itemId: string; judgment: 'again' | 'hard' | 'good' },
    ) {
        return this.srsService.submitResponse(user.id, data.itemId, data.judgment);
    }

    @Post('items')
    async createItem(
        @CurrentUser() user: any,
        @Body() data: { itemType: 'vocab' | 'grammar_pattern' | 'sentence'; content: any; priority?: number },
    ) {
        return this.srsService.createItem(user.id, data);
    }
}
