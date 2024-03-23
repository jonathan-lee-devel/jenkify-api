import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  Response,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import e from 'express';

import { EnvironmentVariables } from '../../../../config/configuration';
import { User } from '../../../users/models/User.model';
import { GetTokenHoldRequestDto } from '../../dtos/GetTokenHoldRequest.dto';
import { LoginRequestDto } from '../../dtos/LoginRequest.dto';
import { GoogleOauthGuard } from '../../guards/google-oauth/google-oauth.guard';
import { AuthService } from '../../services/auth/auth.service';

/**
 * AuthController handles authentication related endpoints.
 */
@Controller()
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly logger: Logger,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticates a user using Google OAuth.
   *
   * @Get('google')
   * @UseGuards(GoogleOauthGuard)
   * @return {Promise<void>} - A promise that resolves with the authentication result.
   */
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth(): Promise<void> {
    return;
  }

  /**
   * Redirects user to the Google login success page after successful authentication.
   *
   * @param {e.Request} req - The request object.
   * @param {e.Response} res - The response object.
   *
   * @throws {UnauthorizedException} If the user is not authenticated.
   *
   * @return {Promise<void>}
   */
  @Get('google-redirect')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(
    @Request() req: e.Request,
    @Response() res: e.Response,
  ) {
    if (!(req as any).user) {
      throw new UnauthorizedException();
    }
    const accessTokenResponse = await this.authService.login(
      (req as any).user as User,
    );
    const tokenCodeDocument = await this.authService.placeTokenHold(
      accessTokenResponse.accessToken,
      (req as any).user as User,
    );
    const frontEndUrl = this.configService.getOrThrow<string>(
      EnvironmentVariables.FRONT_END_URL,
    );
    const redirectUrl = `${frontEndUrl}/google-login-success?tokenCode=${encodeURIComponent(tokenCodeDocument.tokenCode)}`;
    this.logger.log(
      `Redirecting user: <${((req as any).user as User).email}> to: ${redirectUrl}`,
    );
    return res.redirect(redirectUrl);
  }

  /**
   * Handles the JWT login request.
   *
   * @param {LoginRequestDto} loginRequestDto - The login request data.
   * @return {Promise<{accessToken: string, refreshToken: string}>}- The authentication tokens.
   * @throws {UnauthorizedException} - If the user credentials are invalid.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequestDto: LoginRequestDto) {
    const user = await this.authService.validateUser(
      loginRequestDto.email,
      loginRequestDto.password,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  /**
   * Retrieves the token hold with the given code.
   *
   * @param {GetTokenHoldRequestDto} getTokenHoldRequestDto - The request DTO containing the token code.
   * @return {Promise<{accessToken: string, refreshToken: string}>} A promise that resolves to the token hold information.
   */
  @Post('token-code')
  async getTokenHold(@Body() getTokenHoldRequestDto: GetTokenHoldRequestDto) {
    this.logger.log(
      `Anonymous request to get token hold with code: ${getTokenHoldRequestDto.tokenCode}`,
    );
    return this.authService.getTokenHold(getTokenHoldRequestDto.tokenCode);
  }
}
