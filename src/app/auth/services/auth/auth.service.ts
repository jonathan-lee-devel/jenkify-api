import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DateTime } from 'luxon';
import { Profile, VerifyCallback } from 'passport-google-oauth20';

import { RandomGenerator } from '../../../../constants/auth.constants';
import { AuthErrorMessages } from '../../../../constants/error.constants';
import { User } from '../../../users/models/User.model';
import { UserProfile } from '../../../users/models/UserProfile.model';
import { UsersService } from '../../../users/services/users/users.service';
import { RandomService } from '../random/random.service';
import { TokenHoldService } from '../token-hold/token-hold.service';

/**
 * AuthService class handles authentication and user login functionality.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenHoldService: TokenHoldService,
    private readonly randomService: RandomService,
  ) {}

  /**
   * Validates a user by checking if the email and password combination is correct.
   *
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   * @return {Promise<User>} A Promise that resolves with the validated User object.
   * @throws {UnauthorizedException} If the user is not found or the password is incorrect.
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user || !user.password) {
      throw new UnauthorizedException(
        AuthErrorMessages.GOOGLE_LOGIN_NO_PASSWORD,
      );
    }
    if (!(await bcrypt.compare(password, user?.password))) {
      throw new UnauthorizedException();
    }
    return user;
  }

  /**
   * Async method for logging in with Google.
   *
   * @param {Profile} profile - The Google profile object.
   * @param {VerifyCallback} done - The callback function to be called when the method completes.
   * @return {Promise<void>} - Returns nothing.
   */
  async googleLogin(profile: Profile, done: VerifyCallback): Promise<void> {
    try {
      const existingUser = await this.usersService.findUserByEmail(
        profile.emails?.[0].value,
      );
      if (existingUser?.isEmailVerified) {
        if (existingUser.googleId === profile.id) {
          return done(null, existingUser);
        }
        existingUser.googleId = profile.id;
        existingUser.isEmailVerified = true;
        await existingUser.save();
        return done(null, existingUser);
      }
      if (!profile.emails?.[0].value) {
        return done(new Error('No value for e-mail provided by Google'));
      }
      const email = String(profile.emails?.[0].value);
      const newUserProfileData: UserProfile = {
        email,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        displayName: profile.displayName,
      };
      const newUserProfile =
        await this.usersService.createUserProfile(newUserProfileData);
      const newUserData: User = {
        email,
        googleId: profile.id,
        isEmailVerified: true,
        userProfile: newUserProfile,
      };
      const newUser = await this.usersService.createUser(newUserData);
      return done(null, newUser);
    } catch (err) {
      this.logger.error(`Error occurred during login with Google: ${err}`);
      return done(new Error('Unexpected error occurred'));
    }
  }

  /**
   * Logs in a user and returns an access token.
   * @param {User} user - The user object containing the user's email.
   * @return {Promise<{accessToken: string}>} - A Promise that resolves to an object containing the access token.
   */
  async login(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email: user.email };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: await this.randomService.generateRandomId(
        RandomGenerator.DEFAULT_TOKEN_LENGTH,
      ),
    };
  }

  /**
   * Creates a token hold for a user.
   *
   * @param {string} accessToken - The access token of the user.
   * @param {User} user - The user object.
   * @return {Promise<Document<TokenHold>>} A Promise that resolves with the created token hold object.
   */
  async placeTokenHold(accessToken: string, user: User) {
    return this.tokenHoldService.createTokenHold({
      email: user.email,
      accessToken,
      tokenCode: await this.randomService.generateRandomId(
        RandomGenerator.DEFAULT_TOKEN_LENGTH,
      ),
      refreshToken: await this.randomService.generateRandomId(
        RandomGenerator.DEFAULT_TOKEN_LENGTH,
      ),
      expiryDate: DateTime.now().plus({ second: 30 }).toJSDate(),
    });
  }

  /**
   * Retrieves the token hold information associated with a given token code.
   *
   * @param {string} tokenCode - The code of the token.
   * @throws {UnauthorizedException} If the token hold information is not found.
   * @return {Promise<{accessToken: string, refreshToken: string}>} A promise that resolves to an object containing the access token and refresh token of the token hold.
   */
  async getTokenHold(
    tokenCode: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHold =
      await this.tokenHoldService.getTokenHoldByTokenCode(tokenCode);
    if (!tokenHold) {
      throw new UnauthorizedException();
    }
    return {
      accessToken: tokenHold.accessToken,
      refreshToken: tokenHold.refreshToken,
    };
  }
}
