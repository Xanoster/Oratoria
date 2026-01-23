import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private userService: UserService) { }

    @Get('me')
    async getProfile(@CurrentUser() user: any) {
        return this.userService.getProfile(user.id);
    }

    @Patch('me')
    async updateProfile(@CurrentUser() user: any, @Body() data: { name?: string; prefs?: any }) {
        return this.userService.updateProfile(user.id, data);
    }

    @Get('progress')
    async getProgress(@CurrentUser() user: any) {
        return this.userService.getProgress(user.id);
    }

    @Delete('voice-data')
    async deleteVoiceData(@CurrentUser() user: any, @Body('confirmation') confirmation: string) {
        return this.userService.deleteVoiceData(user.id, confirmation);
    }
}
