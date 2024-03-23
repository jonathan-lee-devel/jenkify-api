import {Body, Controller, HttpCode, HttpStatus, Post, UseGuards} from '@nestjs/common';
import {ThrottlerGuard} from '@nestjs/throttler';

import {ConfirmRegisterRequestDto} from '../../dtos/ConfirmRegisterRequest.dto';
import {RegisterRequestDto} from '../../dtos/RegisterRequest.dto';
import {RegistrationService} from '../../services/registration/registration.service';

/**
 * Represents a RegisterController that handles user registration.
 */
@Controller('register')
@UseGuards(ThrottlerGuard)
export class RegisterController {
  /**
   * Represents a Constructor.
   * @constructor
   * @param {RegistrationService} registrationService - The registration service to be used.
   */
  constructor(
      private readonly registrationService: RegistrationService,
  ) {}

  /**
   * Registers a user.
   *
   * @param {RegisterRequestDto} registerRequestDto - The registration request information.
   * @return {Promise<RegistrationStatusResponse>} - A Promise that resolves to the registered user.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerRequestDto: RegisterRequestDto) {
    return this.registrationService.registerUser(registerRequestDto);
  }

  /**
   * Confirms the registration of a user.
   *
   * @param {ConfirmRegisterRequestDto} confirmRegisterRequest - The request object containing registration confirmation details.
   *
   * @return {Promise<RegistrationStatusResponse>} A promise that resolves to the result of the registration confirmation.
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmRegister(@Body() confirmRegisterRequest: ConfirmRegisterRequestDto) {
    return this.registrationService.confirmRegistration(confirmRegisterRequest);
  }
}
