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
                _count: {
                    select: {
                        sentences: true
                    }
                }
            }
        });

        // Get user's progress for each scenario
        const scenariosWithProgress = await Promise.all(
            scenarios.map(async (scenario) => {
                // Count completed sentences for this scenario
                const completedCount = await prisma.sRSState.count({
                    where: {
                        userId: user.id,
                        sentence: {
                            lessonSentences: {
                                some: {
                                    lesson: {
                                        narrativeNodes: {
                                            some: {
                                                roleplayScenarioId: scenario.id
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        repetitions: {
                            gte: 3 // Consider mastered after 3 successful repetitions
                        }
                    }
                });

                const totalSentences = scenario._count.sentences || 0;
                const completedSentences = completedCount;

                // Determine status based on progress
                let status: 'completed' | 'active' | 'locked';

                if (completedSentences >= totalSentences && totalSentences > 0) {
                    status = 'completed';
                } else if (completedSentences > 0 || scenario.orderIndex === 0) {
                    status = 'active';
                } else {
                    // Check if previous scenario is completed
                    const previousScenario = scenarios.find(s => s.orderIndex === scenario.orderIndex - 1);
                    if (previousScenario) {
                        const prevCompleted = await prisma.sRSState.count({
                            where: {
                                userId: user.id,
                                sentence: {
                                    lessonSentences: {
                                        some: {
                                            lesson: {
                                                narrativeNodes: {
                                                    some: {
                                                        roleplayScenarioId: previousScenario.id
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                repetitions: { gte: 3 }
                            }
                        });
                        const prevTotal = previousScenario._count.sentences || 0;
                        status = (prevCompleted >= prevTotal && prevTotal > 0) ? 'active' : 'locked';
                    } else {
                        status = 'locked';
                    }
                }

                return {
                    id: scenario.id,
                    title: scenario.title,
                    description: scenario.description,
                    status,
                    totalSentences,
                    completedSentences,
                    icon: scenario.icon || '📚'
                };
            })
        );

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
