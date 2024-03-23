import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configModuleOptions } from './config/app.config';
import { RouterModule } from '@nestjs/core';
import { appRoutes } from './routing/app.routes';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlingLevels } from './throttling/app.throttling';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClientModule } from './app/client/client.module';
import { AuthModule } from './app/auth/auth.module';
import { UsersModule } from './app/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvironmentVariables } from './config/configuration';
import { QueueModule } from './app/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    RouterModule.register(appRoutes),
    ThrottlerModule.forRoot([
      {
        ...ThrottlingLevels.LONG,
      },
    ]),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.getOrThrow<string>(
            EnvironmentVariables.DATABASE_URL,
          ),
          user: configService.getOrThrow<string>(
            EnvironmentVariables.DATABASE_USER,
          ),
          pass: configService.getOrThrow<string>(
            EnvironmentVariables.DATABASE_PASSWORD,
          ),
          dbName: configService.getOrThrow<string>(
            EnvironmentVariables.DATABASE_NAME,
          ),
        };
      },
      inject: [ConfigService],
    }),
    ClientModule,
    AuthModule,
    UsersModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
