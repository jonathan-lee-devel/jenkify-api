import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './controllers/auth/auth.controller';
import { PasswordController } from './controllers/password/password.controller';
import { RegisterController } from './controllers/register/register.controller';
import {
  PasswordResetToken,
  PasswordResetTokenSchema,
} from './models/PasswordResetToken.model';
import {
  RegistrationToken,
  RegistrationTokenSchema,
} from './models/RegistrationToken.model';
import { TokenHold, TokenHoldSchema } from './models/TokenHold.model';
import { PassportGoogleStrategy } from './passport-strategies/passport-google.strategy';
import { PassportJwtStrategy } from './passport-strategies/passport-jwt.strategy';
import { AuthService } from './services/auth/auth.service';
import { PasswordService } from './services/password/password.service';
import { RandomService } from './services/random/random.service';
import { RegistrationService } from './services/registration/registration.service';
import { TokenService } from './services/token/token.service';
import { TokenHoldService } from './services/token-hold/token-hold.service';
import { EnvironmentVariables } from '../../config/configuration';
import { MailModuleInjectionTokens } from '../mail/constants/injection-tokens';
import { MailService } from '../mail/services/mail/mail.service';
import { transporterConfig } from '../mail/transporter/transporter.config';
import { User, UserSchema } from '../users/models/User.model';
import {
  UserProfile,
  UserProfileSchema,
} from '../users/models/UserProfile.model';
import { UsersService } from '../users/services/users/users.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow(EnvironmentVariables.JWT_SECRET),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: TokenHold.name, schema: TokenHoldSchema },
      { name: RegistrationToken.name, schema: RegistrationTokenSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
    UsersModule,
  ],
  controllers: [AuthController, RegisterController, PasswordController],
  providers: [
    {
      provide: Logger,
      useFactory: () => new Logger(AuthModule.name),
    },
    {
      provide: MailModuleInjectionTokens.NODEMAILER_TRANSPORTER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        transporterConfig(
          configService.getOrThrow<string>(EnvironmentVariables.EMAIL_USER),
          configService.getOrThrow<string>(EnvironmentVariables.EMAIL_PASSWORD),
        ),
    },
    PassportGoogleStrategy,
    PassportJwtStrategy,
    AuthService,
    UsersService,
    TokenHoldService,
    RandomService,
    RegistrationService,
    PasswordService,
    TokenService,
    MailService,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
