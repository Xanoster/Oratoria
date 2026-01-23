import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { LessonModule } from './lesson/lesson.module';
import { PlacementModule } from './placement/placement.module';
import { SpeakModule } from './speak/speak.module';
import { AnalysisModule } from './analysis/analysis.module';
import { SrsModule } from './srs/srs.module';
import { RagModule } from './rag/rag.module';
import { AiAdapterModule } from './ai-adapter/ai-adapter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        // Global config
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
        }),

        // Bull queue for background jobs
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            },
        }),

        // Database
        PrismaModule,

        // Feature modules
        AuthModule,
        UserModule,
        LessonModule,
        PlacementModule,
        SpeakModule,
        AnalysisModule,
        SrsModule,
        RagModule,
        AiAdapterModule,
        NotificationsModule,
    ],
})
export class AppModule { }
