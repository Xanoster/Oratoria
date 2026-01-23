import { Module } from '@nestjs/common';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';
import { AiAdapterModule } from '../ai-adapter/ai-adapter.module';

@Module({
    imports: [AiAdapterModule],
    controllers: [PlacementController],
    providers: [PlacementService],
    exports: [PlacementService],
})
export class PlacementModule { }
