import { Module } from '@nestjs/common';
import { AdaptiveLearningController } from './adaptive-learning.controller';
import { AdaptiveLearningService } from './adaptive-learning.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdaptiveLearningController],
    providers: [AdaptiveLearningService],
    exports: [AdaptiveLearningService],
})
export class AdaptiveLearningModule { }
