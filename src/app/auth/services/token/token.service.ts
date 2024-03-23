import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';

import { RandomGenerator } from '../../../../constants/auth.constants';
import { PasswordResetToken } from '../../models/PasswordResetToken.model';
import { RegistrationToken } from '../../models/RegistrationToken.model';
import { RandomService } from '../random/random.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly logger: Logger,
    @InjectModel(RegistrationToken.name)
    private readonly registrationTokenModel: Model<RegistrationToken>,
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetTokenModel: Model<PasswordResetToken>,
    private readonly randomService: RandomService,
  ) {}

  async generateTokensForNewUser(email: string) {
    this.logger.log(`Generating new tokens for e-mail: <${email}>`);
    const registrationToken = await this.registrationTokenModel.create({
      email,
      value: await this.randomService.generateRandomId(
        RandomGenerator.DEFAULT_TOKEN_LENGTH,
      ),
      expiryDate: DateTime.now().plus({ minutes: 15 }).toJSDate(),
    });
    const passwordResetToken = await this.passwordResetTokenModel.create({
      email,
      value: await this.randomService.generateRandomId(
        RandomGenerator.DEFAULT_TOKEN_LENGTH,
      ),
      expiryDate: DateTime.now().toJSDate(),
    });
    return {
      registrationToken,
      passwordResetToken,
    };
  }

  async deleteTokensForEmail(email: string) {
    this.logger.log(`Deleting associated tokens for e-mail: <${email}>`);
    await this.registrationTokenModel.deleteOne({ email }).exec();
    await this.passwordResetTokenModel.deleteOne({ email }).exec();
  }

  async getRegistrationTokenByValue(tokenValue: string) {
    this.logger.log(
      `Retrieving registration token by token value: ${tokenValue}`,
    );
    return this.registrationTokenModel.findOne({ value: tokenValue }).exec();
  }

  async getPasswordResetTokenByValue(tokenValue: string) {
    this.logger.log(
      `Retrieving password reset token by token value: ${tokenValue}`,
    );
    return this.passwordResetTokenModel.findOne({ value: tokenValue }).exec();
  }
}
