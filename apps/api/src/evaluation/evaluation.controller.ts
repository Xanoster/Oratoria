import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto, EvaluationResponseDto } from './dto/evaluation.dto';

@Controller('evaluation')
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) { }

    /**
     * Create a new evaluation for a user's speech transcript
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createEvaluation(@Body() dto: CreateEvaluationDto): Promise<EvaluationResponseDto> {
        return this.evaluationService.evaluate(dto);
    }

    /**
     * Get a specific evaluation by ID
     */
    @Get(':id')
    async getEvaluation(@Param('id') id: string): Promise<EvaluationResponseDto> {
        const evaluation = await this.evaluationService.getEvaluation(id);
        if (!evaluation) {
            throw new NotFoundException('Evaluation not found');
        }
        return evaluation;
    }

    /**
     * Get all evaluations for a user, optionally filtered by mode
     */
    @Get('user/:userId')
    async getUserEvaluations(
        @Param('userId') userId: string,
        @Query('mode') mode?: string,
    ): Promise<EvaluationResponseDto[]> {
        return this.evaluationService.getUserEvaluations(userId, mode);
    }
}
