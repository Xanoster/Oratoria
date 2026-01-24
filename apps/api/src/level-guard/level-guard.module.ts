import { Module } from '@nestjs/common';
import { LevelGuardService } from './level-guard.service';

@Module({
    providers: [LevelGuardService],
    exports: [LevelGuardService],
})
export class LevelGuardModule { }
