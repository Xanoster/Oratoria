import { Module, Global } from '@nestjs/common';
import { LlmService } from './llm.service';
import { AsrService } from './asr.service';
import { TtsService } from './tts.service';

@Global()
@Module({
    providers: [LlmService, AsrService, TtsService],
    exports: [LlmService, AsrService, TtsService],
})
export class AiAdapterModule { }
