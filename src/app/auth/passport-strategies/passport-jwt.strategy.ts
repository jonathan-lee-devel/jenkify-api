import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {PassportStrategy} from '@nestjs/passport';
import e from 'express';
import {ExtractJwt, Strategy} from 'passport-jwt';

import {EnvironmentVariables} from '../../../config/configuration';
import {PassportStrategies} from '../../../constants/auth.constants';
import {UsersService} from '../../users/services/users/users.service';

/**
 * PassportJwtStrategy class is a Passport strategy for JWT authentication.
 *
 * @remarks
 * This class extends the PassportStrategy class and uses the JWT authentication method.
 */
@Injectable()
export class PassportJwtStrategy extends PassportStrategy(Strategy, PassportStrategies.JWT) {
  constructor(
      readonly configService: ConfigService,
      private readonly jwtService: JwtService,
      private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow(EnvironmentVariables.JWT_SECRET),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(request: e.Request) {
    const jwt = request.headers['authorization'].replace('Bearer ', '');
    const decodedJwt = await this.jwtService.decode(jwt);
    if (this.jwtService.verify(jwt) && decodedJwt) {
      const user = this.usersService.findUserByEmail(decodedJwt.email);
      return user;
    }
    throw new UnauthorizedException();
  }
}
