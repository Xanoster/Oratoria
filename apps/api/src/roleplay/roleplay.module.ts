import { Module } from '@nestjs/common';
import { RoleplayController } from './roleplay.controller';
import { RoleplayService } from './roleplay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiAdapterModule } from '../ai-adapter/ai-adapter.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { LevelGuardModule } from '../level-guard/level-guard.module';

@Module({
    imports: [PrismaModule, AiAdapterModule, EvaluationModule, LevelGuardModule],
    controllers: [RoleplayController],
    providers: [RoleplayService],
    exports: [RoleplayService],
})
export class RoleplayModule { }
