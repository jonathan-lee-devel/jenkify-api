import {TestBed} from '@automock/jest';
import {BadRequestException, ConflictException, InternalServerErrorException} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import {getModelToken} from '@nestjs/mongoose';
import {DateTime} from 'luxon';
import {Model} from 'mongoose';

import {RegistrationService} from './registration.service';
import {WinstonLogger} from '../../../../logging/winston';
import {User} from '../../../users/models/User.model';
import {UserProfile} from '../../../users/models/UserProfile.model';
import {UsersService} from '../../../users/services/users/users.service';
import {ConfirmRegisterRequestDto} from '../../dtos/ConfirmRegisterRequest.dto';
import {RegisterRequestDto} from '../../dtos/RegisterRequest.dto';
import {RegisterEvents} from '../../events/registration';
import {UserRegisteredEvent} from '../../events/registration/registration.event';
import {RegistrationToken} from '../../models/RegistrationToken.model';
import {PasswordService} from '../password/password.service';
import {TokenService} from '../token/token.service';


describe('RegistrationService', () => {
  let service: RegistrationService;
  let mockLogger: jest.Mocked<WinstonLogger>;
  let mockUserModel: jest.Mocked<Model<User>>;
  let mockUserProfileModel: jest.Mocked<Model<UserProfile>>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockTokenService: jest.Mocked<TokenService>;

  // Register Request DTO
  const email = 'test@example.com';
  const firstName = 'John';
  const lastName = 'Doe';
  const password = 'password';
  const confirmPassword = 'password';
  const isAcceptTermsAndConditions = true;

  const validGoogleId = '12345';

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(RegistrationService).compile();
    service = unit;

    mockLogger = unitRef.get<WinstonLogger>(WinstonLogger);
    mockUserModel = unitRef.get<Model<User>>(getModelToken(User.name));
    mockUserProfileModel = unitRef.get<Model<UserProfile>>(getModelToken(UserProfile.name));
    mockEventEmitter = unitRef.get<EventEmitter2>(EventEmitter2);
    mockUsersService = unitRef.get<UsersService>(UsersService);
    mockPasswordService = unitRef.get<PasswordService>(PasswordService);
    mockTokenService = unitRef.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log and delete tokens if no existing user returned', async () => {
    const existingUser = null;
    const existingGoogleUser = null;
    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(existingUser),
        populate: jest.fn().mockImplementation(
          () => ({exec: jest.fn().mockResolvedValue(existingGoogleUser)}),
        )}),
    );

    mockTokenService.generateTokensForNewUser.mockResolvedValue({
      registrationToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
      passwordResetToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
    } as any);

    const registerRequestDto: RegisterRequestDto = {
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      isAcceptTermsAndConditions,
    };

    await service.registerUser(registerRequestDto);

    expect(mockUserModel.findOne).toHaveBeenCalledWith({email});
    expect(mockLogger.log).toHaveBeenCalledWith(`No user found for e-mail: <${email}>, deleting any possible associated tokens`);
    expect(mockTokenService.deleteTokensForEmail).toHaveBeenCalledWith(email);
    expect(mockTokenService.deleteTokensForEmail).toHaveBeenCalledTimes(2);
  });

  it('should log and delete tokens if existingUser && !existingUser.isEmailVerified && !existingUser.googleId', async () => {
    const existingUser = {
      isEmailVerified: false,
      googleId: undefined,
    };
    const existingGoogleUser = null;
    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(existingUser),
        populate: jest.fn().mockImplementation(
          () => ({exec: jest.fn().mockResolvedValue(existingGoogleUser)}),
        )}),
    );

    mockTokenService.generateTokensForNewUser.mockResolvedValue({
      registrationToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
      passwordResetToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
    } as any);

    const registerRequestDto: RegisterRequestDto = {
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      isAcceptTermsAndConditions,
    };

    await service.registerUser(registerRequestDto);

    expect(mockUserModel.findOne).toHaveBeenCalledWith({email});
    expect(mockLogger.log).toHaveBeenCalledWith(`Existing user: <${email}> detected without verified e-mail or Google ID, deleting user and associated tokens`);
    expect(mockTokenService.deleteTokensForEmail).toHaveBeenCalledWith(email);
    expect(mockTokenService.deleteTokensForEmail).toHaveBeenCalledTimes(2);
  });

  it('should log and not delete tokens if existingUser?.isEmailVerified && existingUser.googleId && !existingUser.password', async () => {
    const existingUser = {
      isEmailVerified: true,
      googleId: validGoogleId,
      password: undefined,
    };
    const existingGoogleUser = null;
    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(existingUser),
        populate: jest.fn().mockImplementation(
          () => ({exec: jest.fn().mockResolvedValue(existingGoogleUser)}),
        )}),
    );

    mockTokenService.generateTokensForNewUser.mockResolvedValue({
      registrationToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
      passwordResetToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
    } as any);

    const registerRequestDto: RegisterRequestDto = {
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      isAcceptTermsAndConditions,
    };

    await service.registerUser(registerRequestDto);

    expect(mockUserModel.findOne).toHaveBeenCalledWith({email});
    expect(mockLogger.log).toHaveBeenCalledWith(`Existing user: <${email}> with e-mail verified, Google ID, and no password, allowing registration`);
    expect(mockTokenService.deleteTokensForEmail).toHaveBeenCalledTimes(1);
  });

  it('should log and throw conflict exception if existingUser.isEmailVerified && existingUser.googleId && existingUser.password', async () => {
    const existingUser = {
      isEmailVerified: true,
      googleId: validGoogleId,
      password,
    };
    const existingGoogleUser = null;
    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(existingUser),
        populate: jest.fn().mockImplementation(
          () => ({exec: jest.fn().mockResolvedValue(existingGoogleUser)}),
        )}),
    );

    mockTokenService.generateTokensForNewUser.mockResolvedValue({
      registrationToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
      passwordResetToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
    } as any);

    const registerRequestDto: RegisterRequestDto = {
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      isAcceptTermsAndConditions,
    };

    try {
      await service.registerUser(registerRequestDto);
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.message).toBe('Conflict');
    }

    expect(mockUserModel.findOne).toHaveBeenCalledWith({email});
    expect(mockLogger.log).toHaveBeenCalledWith(`Conflict during registration for user with e-mail: <${email}>`);
    expect(mockTokenService.deleteTokensForEmail).not.toHaveBeenCalledWith(email);
  });

  it('should register with existing google user if existingUser?.isEmailVerified && existingUser.googleId && !existingUser.password', async () => {
    const existingUser = {
      isEmailVerified: true,
      googleId: validGoogleId,
      password: undefined,
    };
    const existingGoogleUser: User = {
      email,
      isEmailVerified: true,
      googleId: validGoogleId,
      userProfile: {
        _id: '12345' as any,
        email,
        firstName,
        lastName,
        displayName: firstName,
      },
    };
    (existingGoogleUser as any).save = jest.fn();
    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(existingUser),
        populate: jest.fn().mockImplementation(
          () => ({exec: jest.fn().mockResolvedValue(existingGoogleUser)}),
        )}),
    );
    mockUserProfileModel.updateOne = jest.fn().mockImplementation(
      () => ({exec: jest.fn()}),
    );

    const registrationTokenValue = '6789';
    mockTokenService.generateTokensForNewUser.mockResolvedValue({
      registrationToken: {
        email,
        value: registrationTokenValue,
        expiryDate: DateTime.now().toJSDate(),
      },
      passwordResetToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
    } as any);

    const registerRequestDto: RegisterRequestDto = {
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      isAcceptTermsAndConditions,
    };

    const result = await service.registerUser(registerRequestDto);

    expect(mockUserModel.findOne).toHaveBeenCalledWith({email});
    expect(mockLogger.log).toHaveBeenCalledWith(`Existing user: <${email}> with e-mail verified, Google ID, and no password, allowing registration`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Registering user: <${registerRequestDto.email}> with existing Google logged-in account`);
    expect(mockTokenService.deleteTokensForEmail).toHaveBeenCalledTimes(1);
    expect(mockPasswordService.encodePassword).toHaveBeenCalledWith(password);
    expect((existingGoogleUser as any).save).toHaveBeenCalled();
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      RegisterEvents.UserRegisteredEvent,
      new UserRegisteredEvent(email, registrationTokenValue),
    );
    expect(result).toStrictEqual({status: 'AWAITING_EMAIL_VERIFICATION'});
  });

  it('should register with no existing google user if !existingUser', async () => {
    const existingUser = null;
    const existingGoogleUser = null;
    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(existingUser),
        populate: jest.fn().mockImplementation(
          () => ({exec: jest.fn().mockResolvedValue(existingGoogleUser)}),
        )}),
    );

    const registrationTokenValue = '6789';
    mockTokenService.generateTokensForNewUser.mockResolvedValue({
      registrationToken: {
        email,
        value: registrationTokenValue,
        expiryDate: DateTime.now().toJSDate(),
      },
      passwordResetToken: {
        email,
        value: Math.random().toString(),
        expiryDate: DateTime.now().toJSDate(),
      },
    } as any);
    const userProfile: UserProfile = {
      email,
      firstName,
      lastName,
      displayName: firstName,
    };
    const encodedPassword = 'encoded';
    mockPasswordService.encodePassword.mockResolvedValue(encodedPassword);
    mockUsersService.createUserProfile.mockResolvedValue(userProfile as any);

    const registerRequestDto: RegisterRequestDto = {
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      isAcceptTermsAndConditions,
    };

    const result = await service.registerUser(registerRequestDto);

    expect(mockUserModel.findOne).toHaveBeenCalledWith({email});
    expect(mockLogger.log).toHaveBeenCalledWith(`No user found for e-mail: <${email}>, deleting any possible associated tokens`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Registering user: <${registerRequestDto.email}> with no existing logged-in with Google account`);
    expect(mockTokenService.deleteTokensForEmail).toHaveBeenCalledTimes(2);
    expect(mockUsersService.createUserProfile).toBeCalledWith(userProfile);
    expect(mockUserModel.create).toHaveBeenCalledWith({
      email,
      isEmailVerified: false,
      password: encodedPassword,
      userProfile,
    } as User);
    expect(mockPasswordService.encodePassword).toHaveBeenCalledWith(password);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      RegisterEvents.UserRegisteredEvent,
      new UserRegisteredEvent(email, registrationTokenValue),
    );
    expect(result).toStrictEqual({status: 'AWAITING_EMAIL_VERIFICATION'});
  });

  it('should throw bad request exception when token is expired during confirm registration', async () => {
    const token: RegistrationToken = {
      email,
      value: Math.random().toString(),
      expiryDate: DateTime.now().toJSDate(),
    };

    mockTokenService.getRegistrationTokenByValue.mockResolvedValue(token as any);

    const confirmRegisterRequestDto: ConfirmRegisterRequestDto = {
      tokenValue: '12345',
    };

    try {
      await service.confirmRegistration(confirmRegisterRequestDto);
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toStrictEqual('Registration verification token is expired');
    }
  });

  it(`should throw internal server error exception when user doesn't exist during confirm registration`, async () => {
    const token: RegistrationToken = {
      email,
      value: Math.random().toString(),
      expiryDate: DateTime.now().plus({days: 1}).toJSDate(),
    };

    mockTokenService.getRegistrationTokenByValue.mockResolvedValue(token as any);
    mockUsersService.findUserByEmail.mockResolvedValue(null);

    const confirmRegisterRequestDto: ConfirmRegisterRequestDto = {
      tokenValue: '12345',
    };

    try {
      await service.confirmRegistration(confirmRegisterRequestDto);
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
      expect(err.message).toStrictEqual('Internal Server Error');
    }
  });

  it(`should save user and token and log message with status success during confirm registration`, async () => {
    const token: RegistrationToken = {
      email,
      value: Math.random().toString(),
      expiryDate: DateTime.now().plus({days: 1}).toJSDate(),
    };
    (token as any).save = jest.fn();

    mockTokenService.getRegistrationTokenByValue.mockResolvedValue(token as any);
    const user = {email, isEmailVerified: false, save: jest.fn()};
    mockUsersService.findUserByEmail.mockResolvedValue(user as any);

    const confirmRegisterRequestDto: ConfirmRegisterRequestDto = {
      tokenValue: '12345',
    };

    const result = await service.confirmRegistration(confirmRegisterRequestDto);


    expect((token as any).save).toHaveBeenCalled();
    expect(user.save).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(`Successful registration confirmation for user: <${email}>`);
    expect(result).toStrictEqual({status: 'SUCCESS'});
  });
});
