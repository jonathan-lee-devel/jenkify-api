import { Injectable } from '@nestjs/common';
import { JenkinsJobSummaryDto } from '../../../client/dtos/jenkins/JenkinsJobSummary.dto';
import { stringify } from 'yaml';

@Injectable()
export class QueueService {
  convertQueueToYAML(queue: JenkinsJobSummaryDto[]) {
    const hosts = queue.map((job) => job.host);
    const uniqueHosts: Set<string> = new Set(hosts);
    const outputObject = {};
    uniqueHosts.forEach((host) => {
      const jobs = queue.filter((job) => job.host === host);
      outputObject[`\'${host}\'`] = jobs.map((job) => ({
        name: job.name,
        urlEnd: job.url.replace(host, ''),
      }));
    });
    return { yaml: stringify(outputObject).replaceAll('"', '') };
  }
}
