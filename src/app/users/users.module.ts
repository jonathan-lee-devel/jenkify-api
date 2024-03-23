import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './controllers/users/users.controller';
import { User, UserSchema } from './models/User.model';
import { UserProfile, UserProfileSchema } from './models/UserProfile.model';
import { UsersService } from './services/users/users.service';
import {
  PasswordResetToken,
  PasswordResetTokenSchema,
} from '../auth/models/PasswordResetToken.model';
import {
  RegistrationToken,
  RegistrationTokenSchema,
} from '../auth/models/RegistrationToken.model';
import { PasswordService } from '../auth/services/password/password.service';
import { RandomService } from '../auth/services/random/random.service';
import { RegistrationService } from '../auth/services/registration/registration.service';
import { TokenService } from '../auth/services/token/token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: RegistrationToken.name, schema: RegistrationTokenSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: Logger,
      useFactory: () => new Logger(UsersModule.name),
    },
    UsersService,
    RegistrationService,
    PasswordService,
    TokenService,
    RandomService,
  ],
  exports: [],
})
export class UsersModule {}
