import { Routes } from '@nestjs/core';
import { ClientModule } from '../app/client/client.module';
import { AuthModule } from '../app/auth/auth.module';
import { UsersModule } from '../app/users/users.module';
import { QueueModule } from '../app/queue/queue.module';

export const appRoutes: Routes = [
  {
    path: 'auth',
    module: AuthModule,
  },
  {
    path: 'users',
    module: UsersModule,
  },
  {
    path: 'client',
    module: ClientModule,
  },
  {
    path: 'queue',
    module: QueueModule,
  },
];
