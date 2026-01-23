import { Module } from '@nestjs/common';
import { SpeakController } from './speak.controller';
import { SpeakService } from './speak.service';
import { AiAdapterModule } from '../ai-adapter/ai-adapter.module';

@Module({
    imports: [AiAdapterModule],
    controllers: [SpeakController],
    providers: [SpeakService],
    exports: [SpeakService],
})
export class SpeakModule { }
