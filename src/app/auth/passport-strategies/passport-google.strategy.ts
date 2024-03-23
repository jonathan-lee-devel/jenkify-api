import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {Profile, Strategy, VerifyCallback} from 'passport-google-oauth20';

import {EnvironmentVariables} from '../../../config/configuration';
import {PassportStrategies} from '../../../constants/auth.constants';
import {AuthService} from '../services/auth/auth.service';

/**
 * PassportGoogleStrategy class.
 *
 * This class is a Passport strategy that enables authentication using Google OAuth2.0.
 * It extends the PassportStrategy class and utilizes the Google strategy provided by the passport-google-oauth2 package.
 */
@Injectable()
export class PassportGoogleStrategy extends PassportStrategy(Strategy, PassportStrategies.GOOGLE) {
  /**
   * Constructs a new instance of the GoogleStrategy class.
   *
   * @param {ConfigService} configService - The config service used to retrieve environment variables.
   * @param {AuthService} authService - The authentication service used for authentication related tasks.
   */
  constructor(
      readonly configService: ConfigService,
      private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>(EnvironmentVariables.GOOGLE_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(EnvironmentVariables.GOOGLE_CLIENT_SECRET),
      callbackURL: configService.getOrThrow<string>(EnvironmentVariables.GOOGLE_CALLBACK_URL),
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
      scope: ['email', 'profile'],
    });
  }

  /**
   * Validate method for authentication using Google login.
   *
   * @param {string} _accessToken - Access token provided by Google.
   * @param {string} _refreshToken - Refresh token provided by Google.
   * @param {Profile} profile - User profile information obtained from Google.
   * @param {VerifyCallback} done - Callback function to execute after validation.
   * @return {Promise<any>} - Returns a promise that resolves to the result of authentication.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    return this.authService.googleLogin(profile, done);
  }
}
