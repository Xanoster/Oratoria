import { Module, Global } from '@nestjs/common';
import { LlmService } from './llm.service';
import { AsrService } from './asr.service';
import { TtsService } from './tts.service';
import { LevelGuardModule } from '../level-guard/level-guard.module';

@Global()
@Module({
    imports: [LevelGuardModule],
    providers: [LlmService, AsrService, TtsService],
    exports: [LlmService, AsrService, TtsService],
})
export class AiAdapterModule { }
