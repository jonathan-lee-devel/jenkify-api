import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { genSalt } from 'bcrypt';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';

import { RandomGenerator } from '../../../../constants/auth.constants';
import { User } from '../../../users/models/User.model';
import { ConfirmPasswordResetRequestDto } from '../../dtos/ConfirmPasswordResetRequest.dto';
import { PasswordEvents } from '../../events/password';
import { PasswordResetAttemptEvent } from '../../events/password/password-reset-attempt.event';
import { PasswordResetToken } from '../../models/PasswordResetToken.model';
import { RandomService } from '../random/random.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class PasswordService {
  constructor(
    private readonly logger: Logger,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetTokenModel: Model<PasswordResetToken>,
    private readonly tokenService: TokenService,
    private readonly randomService: RandomService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async encodePassword(password: string) {
    return bcrypt.hash(password, await genSalt());
  }

  async resetPassword(email: string) {
    this.logger.log(`Attempt to reset password for e-mail: <${email}>`);
    const user = await this.userModel
      .findOne({ email, isEmailVerified: true })
      .exec();
    if (!user) {
      // Do not give attackers any indication of user's existence
      return { status: 'AWAITING_EMAIL_VERIFICATION' };
    }

    await this.passwordResetTokenModel.deleteOne({ email }).exec();
    const newPasswordResetToken: PasswordResetToken = {
      email,
      expiryDate: DateTime.now().plus({ minute: 15 }).toJSDate(),
      value: await this.randomService.generateRandomId(
        RandomGenerator.DEFAULT_TOKEN_LENGTH,
      ),
    };
    await this.passwordResetTokenModel.create(newPasswordResetToken);

    this.eventEmitter.emit(
      PasswordEvents.PasswordResetAttemptEvent,
      new PasswordResetAttemptEvent(email, newPasswordResetToken.value),
    );

    return { status: 'AWAITING_EMAIL_VERIFICATION' };
  }

  async confirmPasswordReset(
    confirmPasswordResetRequestDto: ConfirmPasswordResetRequestDto,
  ) {
    const token = await this.tokenService.getPasswordResetTokenByValue(
      confirmPasswordResetRequestDto.tokenValue,
    );
    if (!token) {
      throw new BadRequestException('Invalid token provided');
    }

    const user = await this.userModel.findOne({ email: token.email }).exec();
    if (!user) {
      this.logger.error(
        `No user exists for valid token with value: ${token.value}`,
      );
      throw new InternalServerErrorException();
    }

    if (DateTime.now() >= DateTime.fromJSDate(token.expiryDate)) {
      throw new BadRequestException(
        'E-mail verification has expired for this password reset',
      );
    }

    user.password = await this.encodePassword(
      confirmPasswordResetRequestDto.password,
    );
    await user.save();
    token.expiryDate = DateTime.now().toJSDate();
    await token.save();

    this.logger.log(
      `Password reset successfully for user with e-mail: <${user.email}>`,
    );

    return { status: 'SUCCESS' };
  }
}
