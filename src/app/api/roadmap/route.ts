import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth().catch(() => null);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all roleplay scenarios from database
        const scenarios = await prisma.roleplayScenario.findMany({
            orderBy: {
                orderIndex: 'asc'
            },
            include: {
                sentences: {
                    include: {
                        srsStates: {
                            where: {
                                userId: user.id
                            }
                        }
                    }
                }
            }
        });

        // Map scenarios to roadmap format  
        const scenariosWithProgress = scenarios.map((scenario) => {
            const totalSentences = scenario.sentences.length;
            // A sentence is considered mastered if repetitions >= 3
            const completedSentences = scenario.sentences.filter(s =>
                s.srsStates.some(state => state.repetitions >= 3)
            ).length;

            // All scenarios are available - no locking
            const status = (completedSentences >= totalSentences && totalSentences > 0)
                ? 'completed'
                : 'available';

            // Check if recommended for user's level
            const isRecommended = scenario.cefrLevel === user.cefrLevel;

            return {
                id: scenario.id,
                title: scenario.title,
                description: scenario.description,
                status,
                totalSentences,
                completedSentences,
                icon: scenario.icon || '📚',
                recommended: isRecommended,
                cefrLevel: scenario.cefrLevel
            };
        });

        return NextResponse.json({
            scenarios: scenariosWithProgress
        });

    } catch (error) {
        console.error('Error fetching roadmap:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
