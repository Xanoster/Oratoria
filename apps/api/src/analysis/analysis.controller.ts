import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
    constructor(private analysisService: AnalysisService) { }

    @Get(':id')
    async getAnalysis(@Param('id') id: string) {
        return this.analysisService.getAnalysis(id);
    }
}
