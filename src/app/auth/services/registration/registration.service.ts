import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import mongoose, { Document, Model } from 'mongoose';
import { User } from '../../../users/models/User.model';
import { UserProfile } from '../../../users/models/UserProfile.model';
import { UsersService } from '../../../users/services/users/users.service';
import { RegistrationStatusResponse } from '../../constants/registration';
import { ConfirmRegisterRequestDto } from '../../dtos/ConfirmRegisterRequest.dto';
import { RegisterRequestDto } from '../../dtos/RegisterRequest.dto';
import { RegisterEvents } from '../../events/registration';
import { UserRegisteredEvent } from '../../events/registration/registration.event';
import { PasswordService } from '../password/password.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly logger: Logger,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(UserProfile.name)
    private readonly userProfileModel: Model<UserProfile>,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Registers a new user with the provided registration data.
   *
   * @param {RegisterRequestDto} registerRequestDto - The registration data of the user.
   * @return {Promise<RegistrationStatusResponse>} - The status of the registration process.
   */
  async registerUser(
    registerRequestDto: RegisterRequestDto,
  ): Promise<RegistrationStatusResponse> {
    if (!registerRequestDto.isAcceptTermsAndConditions) {
      throw new BadRequestException('Must accept terms and conditions');
    }
    await this.handleExistingUser(registerRequestDto.email);
    const existingGoogleUser = await this.userModel
      .findOne({ email: registerRequestDto.email })
      .populate('userProfile')
      .exec();
    if (existingGoogleUser) {
      await this.registerWithExistingGoogleUser(
        registerRequestDto,
        existingGoogleUser,
      );
      return { status: 'AWAITING_EMAIL_VERIFICATION' };
    }
    await this.registerWithNoExistingGoogleUser(registerRequestDto);
    return { status: 'AWAITING_EMAIL_VERIFICATION' };
  }

  /**
   * Handles an existing user based on their email address.
   * Deletes any associated tokens if no user is found for the email address.
   * Deletes the user and associated tokens if the user does not have a verified email or Google ID.
   * Returns without further action if the user has a verified email, Google ID, and no password.
   * Throws a ConflictException if none of the above conditions are met.
   *
   * @param {string} email - The email address of the existing user.
   * @return {Promise<void>} - Resolves if the operation is successful.
   * @throws {ConflictException} - If none of the conditions for handling the existing user are met.
   */
  private async handleExistingUser(email: string): Promise<void> {
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (!existingUser) {
      this.logger.log(
        `No user found for e-mail: <${email}>, deleting any possible associated tokens`,
      );
      await this.tokenService.deleteTokensForEmail(email);
      return;
    }
    if (
      existingUser &&
      !existingUser.isEmailVerified &&
      !existingUser.googleId
    ) {
      this.logger.log(
        `Existing user: <${email}> detected without verified e-mail or Google ID, deleting user and associated tokens`,
      );
      await this.tokenService.deleteTokensForEmail(email);
      return;
    }
    if (
      existingUser?.isEmailVerified &&
      existingUser.googleId &&
      !existingUser.password
    ) {
      this.logger.log(
        `Existing user: <${email}> with e-mail verified, Google ID, and no password, allowing registration`,
      );
      return;
    }
    this.logger.log(
      `Conflict during registration for user with e-mail: <${email}>`,
    );
    throw new ConflictException();
  }

  /**
   * Registers a user with an existing Google account.
   *
   * @param {RegisterRequestDto} registerRequestDto - The registration data for the user.
   * @param {Document<User>} existingGoogleUser - The existing Google user document.
   * @return {Promise<void>} - A Promise that resolves once the user registration is complete.
   */
  private async registerWithExistingGoogleUser(
    registerRequestDto: RegisterRequestDto,
    existingGoogleUser: Document<unknown, {}, User> &
      User &
      Required<{ _id: mongoose.Types.ObjectId }>,
  ): Promise<void> {
    this.logger.log(
      `Registering user: <${registerRequestDto.email}> with existing Google logged-in account`,
    );
    await this.userProfileModel
      .updateOne(
        { _id: existingGoogleUser.userProfile._id },
        {
          $set: {
            firstName: registerRequestDto.firstName,
            lastName: registerRequestDto.lastName,
          },
        },
      )
      .exec();
    existingGoogleUser.password = await this.passwordService.encodePassword(
      registerRequestDto.password,
    );
    await existingGoogleUser.save();
    await this.tokenService.deleteTokensForEmail(registerRequestDto.email);
    const { registrationToken } =
      await this.tokenService.generateTokensForNewUser(
        registerRequestDto.email,
      );
    this.eventEmitter.emit(
      RegisterEvents.UserRegisteredEvent,
      new UserRegisteredEvent(
        registerRequestDto.email,
        registrationToken.value,
      ),
    );
  }

  /**
   * Registers a user with no existing Google account.
   *
   * @param {RegisterRequestDto} registerRequestDto - The register request data transfer object containing the user's registration details.
   *
   * @return {Promise<void>} - A promise that resolves when the user has been successfully registered.
   */
  private async registerWithNoExistingGoogleUser(
    registerRequestDto: RegisterRequestDto,
  ): Promise<void> {
    this.logger.log(
      `Registering user: <${registerRequestDto.email}> with no existing logged-in with Google account`,
    );
    const newUserProfileData: UserProfile = {
      email: registerRequestDto.email,
      firstName: registerRequestDto.firstName,
      lastName: registerRequestDto.lastName,
      displayName: registerRequestDto.firstName,
    };
    const newUserProfile =
      await this.usersService.createUserProfile(newUserProfileData);
    const newUserData: User = {
      email: registerRequestDto.email,
      isEmailVerified: false,
      password: await this.passwordService.encodePassword(
        registerRequestDto.password,
      ),
      userProfile: newUserProfile,
    };
    await this.userModel.create(newUserData);
    await this.tokenService.deleteTokensForEmail(registerRequestDto.email);
    const { registrationToken } =
      await this.tokenService.generateTokensForNewUser(
        registerRequestDto.email,
      );
    this.eventEmitter.emit(
      RegisterEvents.UserRegisteredEvent,
      new UserRegisteredEvent(
        registerRequestDto.email,
        registrationToken.value,
      ),
    );
  }

  /**
   * Confirm user registration by verifying registration token.
   * @param {ConfirmRegisterRequestDto} confirmRegisterRequest - The request object containing the registration token value.
   * @throws {BadRequestException} - If the registration verification token is expired.
   * @throws {InternalServerErrorException} - If the registration token exists with no existing user.
   * @return {Promise<Object>} - The status object indicating the success of the registration confirmation.
   */
  async confirmRegistration(
    confirmRegisterRequest: ConfirmRegisterRequestDto,
  ): Promise<RegistrationStatusResponse> {
    const registrationToken =
      await this.tokenService.getRegistrationTokenByValue(
        confirmRegisterRequest.tokenValue,
      );
    if (DateTime.now() >= DateTime.fromJSDate(registrationToken.expiryDate)) {
      throw new BadRequestException(
        'Registration verification token is expired',
      );
    }

    const user = await this.usersService.findUserByEmail(
      registrationToken.email,
    );
    if (!user) {
      this.logger.error(
        `Registration token with value: ${registrationToken.value} exists with no existing user: <${registrationToken.email}>`,
      );
      throw new InternalServerErrorException();
    }

    user.isEmailVerified = true;
    await user.save();

    registrationToken.expiryDate = DateTime.now().toJSDate();
    await registrationToken.save();

    this.logger.log(
      `Successful registration confirmation for user: <${user.email}>`,
    );
    return { status: 'SUCCESS' };
  }
}
