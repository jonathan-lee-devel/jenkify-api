export class JenkinsBuildDto {
  building: boolean;
  description: string | null;
  displayName: string;
  duration: number;
  estimatedDuration: number;
  fullDisplayName: string;
  id: string;
  inProgress: boolean;
  result: string;
}
