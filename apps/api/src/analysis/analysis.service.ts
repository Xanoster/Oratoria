import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysisService {
    constructor(private prisma: PrismaService) { }

    async getAnalysis(analysisId: string) {
        const analysis = await this.prisma.analysis.findUnique({
            where: { id: analysisId },
        });

        if (!analysis) {
            throw new NotFoundException('Analysis not found');
        }

        return {
            pronunciationScore: analysis.pronunciationScore,
            errors: this.extractErrors(analysis.phonemeScores),
            grammarIssues: analysis.grammarIssues,
            confidence: analysis.llmConfidence,
        };
    }

    private extractErrors(phonemeScores: any): Array<{ type: string; token: string; phoneme: string; position: number }> {
        if (!phonemeScores || typeof phonemeScores !== 'object') {
            return [];
        }

        const errors: Array<{ type: string; token: string; phoneme: string; position: number }> = [];

        // Extract low-scoring phonemes
        const scores = phonemeScores as Record<string, any>;
        Object.entries(scores).forEach(([phoneme, data]: [string, any], index) => {
            if (data.score < 0.5) {
                errors.push({
                    type: 'pronunciation',
                    token: data.word || phoneme,
                    phoneme,
                    position: index,
                });
            }
        });

        return errors;
    }
}
