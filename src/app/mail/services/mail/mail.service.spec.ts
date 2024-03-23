import {TestBed} from '@automock/jest';
import {ConfigService} from '@nestjs/config';
import {Transporter} from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import {MailService} from './mail.service';
import {EnvironmentVariables} from '../../../../config/configuration';
import {WinstonLogger} from '../../../../logging/winston';
import {PasswordResetAttemptEvent} from '../../../auth/events/password/password-reset-attempt.event';
import {UserRegisteredEvent} from '../../../auth/events/registration/registration.event';
import {InvitedTenantToPropertyEvent} from '../../../properties/events/properties/invited-tenant-to-property.event';
import {MailModuleInjectionTokens} from '../../constants/injection-tokens';


describe('MailService', () => {
  let service: MailService;
  let mockLogger: jest.Mocked<WinstonLogger>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockTransporter: jest.Mocked<Transporter<SMTPTransport.SentMessageInfo>>;

  const email = 'test@example.com';
  const tokenValue = Math.random().toString();

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(MailService).compile();
    service = unit;

    mockLogger = unitRef.get<WinstonLogger>(WinstonLogger);
    mockConfigService = unitRef.get<ConfigService>(ConfigService);
    mockTransporter = unitRef.get<Transporter<SMTPTransport.SentMessageInfo>>(MailModuleInjectionTokens.NODEMAILER_TRANSPORTER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log message and send mail successfully on user registered event', async () => {
    const userRegisteredEvent = new UserRegisteredEvent(email, tokenValue);

    const frontEndUrl = 'http://localhost:4200';

    // @ts-expect-error front-end URL is a string
    mockConfigService.getOrThrow.mockResolvedValue(frontEndUrl);

    mockTransporter.sendMail.mockResolvedValue({accepted: [email]} as any);

    await service.onUserRegisteredEvent(userRegisteredEvent);

    expect(mockLogger.log).toHaveBeenCalledWith(`On -> user registered event with e-mail: <${userRegisteredEvent.email}>`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Sending e-mail from: Dev.RoomyLedger to: <${email}> with subject: Registration Confirmation`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Successfully sent e-mail to: <${email}>`);
  });

  it('should log message and send mail successfully on tenant invited to property event', async () => {
    const token = {
      emailToInvite: email,
      propertyId: '12345',
      value: 'random-value',
    };
    const invitedTenantToPropertyEvent = new InvitedTenantToPropertyEvent(token as any);

    const frontEndUrl = 'http://localhost:4200';

    // @ts-expect-error front-end URL is a string
    mockConfigService.getOrThrow.mockResolvedValue(frontEndUrl);

    mockTransporter.sendMail.mockResolvedValue({accepted: [email]} as any);

    await service.onInvitedTenantToPropertyEvent(invitedTenantToPropertyEvent);

    expect(mockLogger.log).toHaveBeenCalledWith(`On -> invited tenant to property event with e-mail to invite: <${invitedTenantToPropertyEvent.propertyInvitationToken.emailToInvite}>`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Sending e-mail from: Dev.RoomyLedger to: <${email}> with subject: Invited to Property`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Successfully sent e-mail to: <${email}>`);
  });

  it('should change from name based when NODE_ENV staging when sending mail', async () => {
    const userRegisteredEvent = new UserRegisteredEvent(email, tokenValue);

    const frontEndUrl = 'http://localhost:4200';

    mockConfigService.getOrThrow.mockImplementation((property) => {
      if (property === EnvironmentVariables.FRONT_END_URL) {
        return frontEndUrl;
      } else if (property === EnvironmentVariables.NODE_ENV) {
        return 'staging';
      }
    });

    mockTransporter.sendMail.mockResolvedValue({accepted: [email]} as any);

    await service.onUserRegisteredEvent(userRegisteredEvent);

    expect(mockLogger.log).toHaveBeenCalledWith(`Sending e-mail from: Staging.RoomyLedger to: <${email}> with subject: Registration Confirmation`);
  });

  it('should change from name based when NODE_ENV production when sending mail', async () => {
    const userRegisteredEvent = new UserRegisteredEvent(email, tokenValue);

    const frontEndUrl = 'http://localhost:4200';

    mockConfigService.getOrThrow.mockImplementation((property) => {
      if (property === EnvironmentVariables.FRONT_END_URL) {
        return frontEndUrl;
      } else if (property === EnvironmentVariables.NODE_ENV) {
        return 'production';
      }
    });

    mockTransporter.sendMail.mockResolvedValue({accepted: [email]} as any);

    await service.onUserRegisteredEvent(userRegisteredEvent);

    expect(mockLogger.log).toHaveBeenCalledWith(`Sending e-mail from: RoomyLedger to: <${email}> with subject: Registration Confirmation`);
  });

  it('should log message and attempt to send mail on error for user registered event', async () => {
    const userRegisteredEvent = new UserRegisteredEvent(email, tokenValue);

    const frontEndUrl = 'http://localhost:4200';

    // @ts-expect-error front-end URL is a string
    mockConfigService.getOrThrow.mockResolvedValue(frontEndUrl);

    const response = 'fail';
    mockTransporter.sendMail.mockResolvedValue({accepted: [], response} as any);

    await service.onUserRegisteredEvent(userRegisteredEvent);

    expect(mockLogger.log).toHaveBeenCalledWith(`On -> user registered event with e-mail: <${userRegisteredEvent.email}>`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Sending e-mail from: Dev.RoomyLedger to: <${email}> with subject: Registration Confirmation`);
    expect(mockLogger.error).toHaveBeenCalledWith(`Error while sending e-mail to: <${email}>: ${response}`);
  });

  it('should log message and send mail on password reset event', async () => {
    const passwordResetAttemptEvent = new PasswordResetAttemptEvent(email, tokenValue);
    mockTransporter.sendMail.mockResolvedValue({accepted: [email]} as any);

    await service.onPasswordResetEvent(passwordResetAttemptEvent);

    expect(mockLogger.log).toHaveBeenCalledWith(`On -> password reset attempt event with e-mail: <${passwordResetAttemptEvent.email}>`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Sending e-mail from: Dev.RoomyLedger to: <${email}> with subject: Password Reset`);
    expect(mockLogger.log).toHaveBeenCalledWith(`Successfully sent e-mail to: <${email}>`);
  });
});
