import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';
import { JenkinsBuildDto } from '../../dtos/jenkins/JenkinsBuild.dto';
import { JenkinsInfoDto } from '../../dtos/jenkins/JenkinsInfo.dto';
import { JenkinsJobSummaryDto } from '../../dtos/jenkins/JenkinsJobSummary.dto';

@Injectable()
export class ClientService {
  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
  ) {}

  getJobs() {
    return this.httpService
      .get<AxiosResponse<JenkinsInfoDto>>('http://localhost:8080/api/json')
      .pipe(
        map((response: AxiosResponse) => <JenkinsInfoDto>response.data),
        map((data) =>
          data.jobs.map(
            (job) =>
              <JenkinsJobSummaryDto>{
                host: 'http://localhost:8080',
                name: job.name,
                url: job.url,
                color: job.color,
              },
          ),
        ),
      );
  }

  getBuildData(jobName: string, buildNumber: number) {
    return this.httpService
      .get<
        AxiosResponse<JenkinsBuildDto>
      >(`http://localhost:8080/job/${jobName}/${buildNumber}/api/json`)
      .pipe(
        map((response: AxiosResponse) => <JenkinsBuildDto>response.data),
        map(
          (data) =>
            <JenkinsBuildDto>{
              host: 'http://localhost:8080',
              id: data.id,
              building: data.building,
              description: data.description,
              displayName: data.displayName,
              duration: data.duration,
              estimatedDuration: data.estimatedDuration,
              fullDisplayName: data.fullDisplayName,
              result: data.result,
              inProgress: data.inProgress,
            },
        ),
      );
  }
}
