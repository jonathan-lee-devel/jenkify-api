import { Module } from '@nestjs/common';
import { QueueController } from './controllers/queue/queue.controller';
import { QueueService } from './services/queue/queue.service';

@Module({
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
