import {TestBed} from '@automock/jest';
import {BadRequestException, InternalServerErrorException} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import {getModelToken} from '@nestjs/mongoose';
import {DateTime} from 'luxon';
import {Model} from 'mongoose';

import {PasswordService} from './password.service';
import {WinstonLogger} from '../../../../logging/winston';
import {User} from '../../../users/models/User.model';
import {ConfirmPasswordResetRequestDto} from '../../dtos/ConfirmPasswordResetRequest.dto';
import {PasswordEvents} from '../../events/password';
import {PasswordResetAttemptEvent} from '../../events/password/password-reset-attempt.event';
import {PasswordResetToken} from '../../models/PasswordResetToken.model';
import {RandomService} from '../random/random.service';
import {TokenService} from '../token/token.service';


describe('PasswordService', () => {
  let service: PasswordService;
  let mockLogger: jest.Mocked<WinstonLogger>;
  let mockUserModel: jest.Mocked<Model<User>>;
  let mockPasswordResetTokenModel: jest.Mocked<Model<PasswordResetToken>>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockRandomService: jest.Mocked<RandomService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(PasswordService).compile();
    service = unit;

    mockLogger = unitRef.get<WinstonLogger>(WinstonLogger);
    mockUserModel = unitRef.get<Model<User>>(getModelToken(User.name));
    mockPasswordResetTokenModel = unitRef.get<Model<PasswordResetToken>>(getModelToken(PasswordResetToken.name));
    mockTokenService = unitRef.get<TokenService>(TokenService);
    mockRandomService = unitRef.get<RandomService>(RandomService);
    mockEventEmitter = unitRef.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not be the same password when encoded', async () => {
    const password = 'password123';
    const encodedPassword = await service.encodePassword(password);
    expect(encodedPassword).not.toStrictEqual(password);
  });

  it('should log message and return status when user does not exist when reset password', async () => {
    const email = 'test@example.com';

    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(null),
      }),
    );

    const result = await service.resetPassword(email);

    expect(result).toStrictEqual({status: 'AWAITING_EMAIL_VERIFICATION'});
    expect(mockLogger.log).toHaveBeenCalledWith(`Attempt to reset password for e-mail: <${email}>`);
  });

  it('should log message, delete, emit, and return status when user does exist when reset password', async () => {
    const email = 'test@example.com';
    const randomValue = 'random-value';

    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(true),
      }),
    );

    mockPasswordResetTokenModel.deleteOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn(),
      }),
    );

    mockRandomService.generateRandomId.mockResolvedValue(randomValue);

    const result = await service.resetPassword(email);

    expect(result).toStrictEqual({status: 'AWAITING_EMAIL_VERIFICATION'});
    expect(mockLogger.log).toHaveBeenCalledWith(`Attempt to reset password for e-mail: <${email}>`);
    expect(mockPasswordResetTokenModel.deleteOne).toHaveBeenCalledWith({email});
    expect(mockRandomService.generateRandomId).toHaveBeenCalledTimes(1);
    expect(mockPasswordResetTokenModel.create).toHaveBeenCalledWith({
      email,
      expiryDate: expect.any(Date),
      value: randomValue,
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      PasswordEvents.PasswordResetAttemptEvent,
      new PasswordResetAttemptEvent(email, randomValue),
    );
  });

  it('should throw bad request exception when token does not exist during confirm password reset', async () => {
    mockPasswordResetTokenModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(null),
      }),
    );

    const confirmPasswordResetRequestDto: ConfirmPasswordResetRequestDto = {
      password: 'password',
      confirmPassword: 'password',
      tokenValue: 'random-value',
    };

    await expect(service.confirmPasswordReset(confirmPasswordResetRequestDto)).rejects.toThrow(BadRequestException);
  });

  it('should throw internal server error exception when user does not exist during confirm password reset', async () => {
    mockTokenService.getPasswordResetTokenByValue.mockResolvedValue(true as any);

    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(null),
      }),
    );

    const confirmPasswordResetRequestDto: ConfirmPasswordResetRequestDto = {
      password: 'password',
      confirmPassword: 'password',
      tokenValue: 'random-value',
    };

    await expect(service.confirmPasswordReset(confirmPasswordResetRequestDto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw bad request exception when token is expired during confirm password reset', async () => {
    mockPasswordResetTokenModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue({expiryDate: DateTime.now().toJSDate()}),
      }),
    );

    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(true),
      }),
    );

    const confirmPasswordResetRequestDto: ConfirmPasswordResetRequestDto = {
      password: 'password',
      confirmPassword: 'password',
      tokenValue: 'random-value',
    };

    await expect(service.confirmPasswordReset(confirmPasswordResetRequestDto)).rejects.toThrow(BadRequestException);
  });

  it('should encode password and log message during confirm password reset', async () => {
    const tokenModelSaveMockFunction = jest.fn();
    const token = {
      expiryDate: DateTime.now().plus({minute: 15}).toJSDate(),
      save: tokenModelSaveMockFunction,
    };
    mockTokenService.getPasswordResetTokenByValue.mockResolvedValue(token as any);

    const email = 'test@example.com';

    const userModelSaveMockFunction = jest.fn();
    const user = {email, save: userModelSaveMockFunction, password: undefined};
    mockUserModel.findOne = jest.fn().mockImplementation(
      () => ({
        exec: jest.fn().mockResolvedValue(user),
      }),
    );

    const password = 'password';
    const confirmPasswordResetRequestDto: ConfirmPasswordResetRequestDto = {
      password,
      confirmPassword: password,
      tokenValue: 'random-value',
    };

    const result = await service.confirmPasswordReset(confirmPasswordResetRequestDto);
    expect(result).toStrictEqual({status: 'SUCCESS'});
    expect(mockLogger.log).toHaveBeenCalledWith(`Password reset successfully for user with e-mail: <${email}>`);
    expect(userModelSaveMockFunction).toHaveBeenCalledTimes(1);
    expect(tokenModelSaveMockFunction).toHaveBeenCalledTimes(1);
    expect(user.password).toBeDefined();
    expect(DateTime.fromJSDate(token.expiryDate) <= DateTime.now()).toBeTruthy();
  });
});
