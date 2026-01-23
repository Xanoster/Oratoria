import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('lessons')
export class LessonController {
    constructor(private lessonService: LessonService) { }

    @Get()
    async findAll(@Query('level') level?: string) {
        return this.lessonService.findAll(level);
    }

    @Get('next')
    @UseGuards(JwtAuthGuard)
    async getNextLesson(@CurrentUser() user: any) {
        return this.lessonService.getNextLesson(user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.lessonService.findOne(id);
    }

    @Get(':id/content')
    async getContent(@Param('id') id: string) {
        return this.lessonService.getLessonContent(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@CurrentUser() user: any, @Body() data: { title: string; level: string; content: any }) {
        return this.lessonService.create({ ...data, createdBy: user.id });
    }
}
