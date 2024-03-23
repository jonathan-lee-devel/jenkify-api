import { z } from 'zod';

export const CONFIG_SCHEMA = z.object({
  NODE_ENV: z.union([
    z.literal('development'),
    z.literal('testing'),
    z.literal('staging'),
    z.literal('production'),
  ]),
  PORT: z.number().default(3000),
  FRONT_END_URL: z.string().url(),
  DATABASE_URL: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  JWT_SECRET: z.string(),
  EMAIL_USER: z.string(),
  EMAIL_PASSWORD: z.string(),
  DATADOG_API_KEY: z.string(),
});

export const EnvironmentVariables = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  FRONT_END_URL: 'FRONT_END_URL',
  DATABASE_URL: 'DATABASE_URL',
  DATABASE_USER: 'DATABASE_USER',
  DATABASE_PASSWORD: 'DATABASE_PASSWORD',
  DATABASE_NAME: 'DATABASE_NAME',
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  GOOGLE_CALLBACK_URL: 'GOOGLE_CALLBACK_URL',
  JWT_SECRET: 'JWT_SECRET',
  EMAIL_USER: 'EMAIL_USER',
  EMAIL_PASSWORD: 'EMAIL_PASSWORD',
  DATADOG_API_KEY: 'DATADOG_API_KEY',
};

export default () => ({
  [EnvironmentVariables.PORT]: parseInt(process.env.PORT, 10) || 3000,
});
