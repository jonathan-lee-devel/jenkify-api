import { Logger, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientService } from './services/client/client.service';
import { ClientController } from './controllers/client/client.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 5,
      auth: {
        username: 'jonathan',
        password: 'password',
      },
    }),
  ],
  providers: [
    {
      provide: Logger,
      useFactory: () => new Logger(ClientModule.name),
    },
    ClientService,
  ],
  controllers: [ClientController],
})
export class ClientModule {}
