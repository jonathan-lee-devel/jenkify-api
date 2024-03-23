import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import {
  HttpStatus,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvironmentVariables } from './config/configuration';
import { LoggingInterceptor } from './logging/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule, {
    logger: new Logger('Main'),
  });
  app.use(helmet());

  const configService = app.get<ConfigService>(ConfigService);

  const origin = configService.getOrThrow<string>(
    EnvironmentVariables.FRONT_END_URL,
  );
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: HttpStatus.OK,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  logger.log(`CORS origin set to: ${origin}`);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.useGlobalInterceptors(
    new LoggingInterceptor(new Logger(LoggingInterceptor.name)),
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Jenkify')
    .setDescription('Jenkify API')
    .setVersion('0.0.1')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  });

  logger.log(
    `Running in NODE_ENV: ${configService.getOrThrow<string>(EnvironmentVariables.NODE_ENV)}`,
  );

  const port = configService.getOrThrow<number>(EnvironmentVariables.PORT);
  logger.log(`Listening on port: ${port}`);
  await app.listen(port);
}
bootstrap();
