import { Body, Controller, Post } from '@nestjs/common';
import { JenkinsJobSummaryDto } from '../../../client/dtos/jenkins/JenkinsJobSummary.dto';
import { QueueService } from '../../services/queue/queue.service';

@Controller()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('as-yaml')
  generateYamlFromQueue(@Body() queue: JenkinsJobSummaryDto[]) {
    return this.queueService.convertQueueToYAML(queue);
  }
}
