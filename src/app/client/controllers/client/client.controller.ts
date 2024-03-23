import { Controller, Get, Param } from '@nestjs/common';
import { ClientService } from '../../services/client/client.service';

@Controller()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('jobs')
  getJobs() {
    return this.clientService.getJobs();
  }

  @Get('build/:jobName/:buildNumber')
  getBuildData(
    @Param('jobName') jobName: string,
    @Param('buildNumber') buildNumber: number,
  ) {
    return this.clientService.getBuildData(jobName, buildNumber);
  }
}
