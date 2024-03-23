import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

import {PassportStrategies} from '../../../../constants/auth.constants';

/**
 * GoogleOauthGuard class is responsible for providing authentication guard for Google OAuth.
 * This class extends the AuthGuard class provided by PassportStrategies.
 * It is used for Google OAuth authentication strategy.
 */
@Injectable()
export class GoogleOauthGuard extends AuthGuard(PassportStrategies.GOOGLE) {
  /**
   * Constructor for creating an instance of the class.
   * @constructor
   */
  constructor() {
    super({
      accessType: 'offline',
    });
  }
}
