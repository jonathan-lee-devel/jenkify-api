import configuration from './configuration';

export const configModuleOptions = {
  envFilePath: ['.env', '.env.local'],
  isGlobal: true,
  load: [configuration],
  expandVariables: true,
};
