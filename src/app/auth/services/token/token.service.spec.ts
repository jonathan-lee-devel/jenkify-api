import {TestBed} from '@automock/jest';
import {getModelToken} from '@nestjs/mongoose';
import {DateTime} from 'luxon';
import {Model} from 'mongoose';

import {TokenService} from './token.service';
import {WinstonLogger} from '../../../../logging/winston';
import {PasswordResetToken} from '../../models/PasswordResetToken.model';
import {RegistrationToken} from '../../models/RegistrationToken.model';
import {RandomService} from '../random/random.service';

describe('TokenService', () => {
  let service: TokenService;
  let mockLogger: jest.Mocked<WinstonLogger>;
  let mockRegistrationTokenModel: jest.Mocked<Model<RegistrationToken>>;
  let mockPasswordResetTokenModel: jest.Mocked<Model<PasswordResetToken>>;
  let mockRandomService: jest.Mocked<RandomService>;

  const email = 'test@example.com';

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(TokenService).compile();
    service = unit;

    mockLogger = unitRef.get<WinstonLogger>(WinstonLogger);
    mockRegistrationTokenModel = unitRef.get<Model<RegistrationToken>>(getModelToken(RegistrationToken.name));
    mockPasswordResetTokenModel = unitRef.get<Model<PasswordResetToken>>(getModelToken(PasswordResetToken.name));
    mockRandomService = unitRef.get<RandomService>(RandomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log message and create and return new tokens when generate tokens for user', async () => {
    const registrationToken: RegistrationToken = {
      email,
      expiryDate: DateTime.now().plus({minute: 15}).toJSDate(),
      value: '',
    };
    const passwordResetToken: PasswordResetToken = {
      email,
      expiryDate: DateTime.now().plus({minute: 15}).toJSDate(),
      value: '',
    };
    const value = '12345';

    mockRandomService.generateRandomId.mockResolvedValue(value);
    mockRegistrationTokenModel.create.mockResolvedValue(registrationToken as any);
    mockPasswordResetTokenModel.create.mockResolvedValue(passwordResetToken as any);

    const result = await service.generateTokensForNewUser(email);

    expect(mockLogger.log).toHaveBeenCalledWith(`Generating new tokens for e-mail: <${email}>`);
    registrationToken.value = value;
    passwordResetToken.value = value;
    expect(mockRandomService.generateRandomId).toHaveBeenCalled();
    expect(mockRegistrationTokenModel.create).toHaveBeenCalledWith({email, value, expiryDate: expect.any(Date)});
    expect(mockPasswordResetTokenModel.create).toHaveBeenCalledWith({email, value, expiryDate: expect.any(Date)});
    expect(result).toStrictEqual({registrationToken, passwordResetToken});
  });

  it('should log message and delete tokens for e-mail when delete tokens for e-mail', async () => {
    const registrationTokenExec = jest.fn();
    mockRegistrationTokenModel.deleteOne.mockImplementation(() => ({
      exec: registrationTokenExec,
    }) as any);
    const passwordResetTokenExec = jest.fn();
    mockPasswordResetTokenModel.deleteOne.mockImplementation(() => ({
      exec: passwordResetTokenExec,
    }) as any);

    await service.deleteTokensForEmail(email);

    expect(mockLogger.log).toHaveBeenCalledWith(`Deleting associated tokens for e-mail: <${email}>`);
    expect(mockRegistrationTokenModel.deleteOne).toHaveBeenCalledWith({email});
    expect(mockPasswordResetTokenModel.deleteOne).toHaveBeenCalledWith({email});
    expect(registrationTokenExec).toHaveBeenCalled();
    expect(passwordResetTokenExec).toHaveBeenCalled();
  });

  it('should log message and get registration token by value when get registration token by value', async () => {
    const value = '12345';
    const token: RegistrationToken = {
      email,
      value: '12345',
      expiryDate: DateTime.now().toJSDate(),
    };
    const registrationTokenExec = jest.fn();
    mockRegistrationTokenModel.findOne.mockImplementation(() => ({
      exec: registrationTokenExec,
    }) as any);
    registrationTokenExec.mockResolvedValue(token);
    const result = await service.getRegistrationTokenByValue(value);

    expect(mockLogger.log).toHaveBeenCalledWith(`Retrieving registration token by token value: ${value}`);
    expect(mockRegistrationTokenModel.findOne).toHaveBeenCalledWith({value});
    expect(result).toStrictEqual(token);
  });

  it('should log message and get password reset token by value when get password reset token by value', async () => {
    const value = '12345';
    const token: PasswordResetToken = {
      email,
      value: '12345',
      expiryDate: DateTime.now().toJSDate(),
    };
    const passwordResetTokenExec = jest.fn();
    mockPasswordResetTokenModel.findOne.mockImplementation(() => ({
      exec: passwordResetTokenExec,
    }) as any);
    passwordResetTokenExec.mockResolvedValue(token);
    const result = await service.getPasswordResetTokenByValue(value);

    expect(mockLogger.log).toHaveBeenCalledWith(`Retrieving password reset token by token value: ${value}`);
    expect(mockPasswordResetTokenModel.findOne).toHaveBeenCalledWith({value});
    expect(result).toStrictEqual(token);
  });
});
