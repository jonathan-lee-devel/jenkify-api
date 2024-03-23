import {Body, Controller, HttpCode, HttpStatus, Post, UseGuards} from '@nestjs/common';
import {ThrottlerGuard} from '@nestjs/throttler';

import {ConfirmPasswordResetRequestDto} from '../../dtos/ConfirmPasswordResetRequest.dto';
import {ResetPasswordRequestDto} from '../../dtos/ResetPasswordRequest.dto';
import {PasswordService} from '../../services/password/password.service';

@Controller('password')
@UseGuards(ThrottlerGuard)
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordRequestDto: ResetPasswordRequestDto) {
    return this.passwordService.resetPassword(resetPasswordRequestDto.email);
  }

  @Post('reset/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(@Body() confirmPasswordResetRequestDto: ConfirmPasswordResetRequestDto) {
    return this.passwordService.confirmPasswordReset(confirmPasswordResetRequestDto);
  }
}
