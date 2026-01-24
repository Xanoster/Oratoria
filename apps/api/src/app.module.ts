import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { LessonModule } from './lesson/lesson.module';
import { PlacementModule } from './placement/placement.module';
import { SpeakModule } from './speak/speak.module';
import { AnalysisModule } from './analysis/analysis.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { LevelGuardModule } from './level-guard/level-guard.module';
import { AdaptiveLearningModule } from './adaptive-learning/adaptive-learning.module';
import { RoleplayModule } from './roleplay/roleplay.module';
import { SrsModule } from './srs/srs.module';
import { RagModule } from './rag/rag.module';
import { AiAdapterModule } from './ai-adapter/ai-adapter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        // Global config
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
        }),

        // Database (Supabase PostgreSQL via Prisma)
        PrismaModule,

        // Feature modules
        AuthModule,
        UserModule,
        LessonModule,
        PlacementModule,
        SpeakModule,
        AnalysisModule,
        EvaluationModule,
        LevelGuardModule,
        AdaptiveLearningModule,
        RoleplayModule,
        SrsModule,
        RagModule,
        AiAdapterModule,
        NotificationsModule,
        HealthModule,
    ],
})
export class AppModule { }
