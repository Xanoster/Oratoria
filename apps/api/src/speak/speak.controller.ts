import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { SpeakService } from './speak.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('recordings')
@UseGuards(JwtAuthGuard)
export class SpeakController {
    constructor(private speakService: SpeakService) { }

    @Post()
    async createRecording(
        @CurrentUser() user: any,
        @Body() data: { transcript: string; lessonId?: string; promptId?: string },
    ) {
        return this.speakService.createRecording(user.id, data);
    }

    @Get(':id/status')
    async getStatus(@Param('id') id: string) {
        return this.speakService.getRecordingStatus(id);
    }
}
