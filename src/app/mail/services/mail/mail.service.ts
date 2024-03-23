import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { EnvironmentVariables } from '../../../../config/configuration';
import { PasswordEvents } from '../../../auth/events/password';
import { PasswordResetAttemptEvent } from '../../../auth/events/password/password-reset-attempt.event';
import { RegisterEvents } from '../../../auth/events/registration';
import { UserRegisteredEvent } from '../../../auth/events/registration/registration.event';
import { MailModuleInjectionTokens } from '../../constants/injection-tokens';

/**
 * Class representing a MailService.
 * @class
 * @public
 * @Injectable()
 */
@Injectable()
export class MailService {
  private static readonly NODE_ENV_STAGING = 'staging';
  private static readonly NODE_ENV_PRODUCTION = 'production';

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    @Inject(MailModuleInjectionTokens.NODEMAILER_TRANSPORTER)
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>,
  ) {}

  /**
   * Handles the UserRegisteredEvent.
   *
   * @param {UserRegisteredEvent} userRegisteredEvent - The event object containing the user registration details.
   *
   * @return {Promise<void>} - A promise representing the completion of the email sending operation.
   */
  @OnEvent(RegisterEvents.UserRegisteredEvent, { async: true })
  async onUserRegisteredEvent(userRegisteredEvent: UserRegisteredEvent) {
    this.logger.log(
      `On -> user registered event with e-mail: <${userRegisteredEvent.email}>`,
    );
    await this.sendEmail(
      userRegisteredEvent.email,
      'Registration Confirmation',
      `<h4>Please click the following link to verify your account: <a href="${this.configService.getOrThrow<string>(EnvironmentVariables.FRONT_END_URL)}/register/confirm/${userRegisteredEvent.registrationTokenValue}">Verify Account</a></h4>`,
    );
  }

  /**
   * Handles the password reset event.
   *
   * @param {PasswordResetAttemptEvent} passwordResetAttemptEvent - The password reset attempt event object.
   * @return {Promise<void>} - A Promise that resolves once the event is handled.
   */
  @OnEvent(PasswordEvents.PasswordResetAttemptEvent, { async: true })
  async onPasswordResetEvent(
    passwordResetAttemptEvent: PasswordResetAttemptEvent,
  ) {
    this.logger.log(
      `On -> password reset attempt event with e-mail: <${passwordResetAttemptEvent.email}>`,
    );
    await this.sendEmail(
      passwordResetAttemptEvent.email,
      'Password Reset',
      `<h4>Please click the following link to reset your password: <a href="${this.configService.getOrThrow<string>(EnvironmentVariables.FRONT_END_URL)}/reset-password/confirm/${passwordResetAttemptEvent.passwordResetTokenValue}">Reset Password</a></h4>`,
    );
  }

  /**
   * Sends an e-mail with the specified recipient, subject, and HTML content.
   *
   * @param {string} addressTo - The recipient's e-mail address.
   * @param {string} subject - The e-mail subject.
   * @param {string} html - The body of the e-mail in HTML format.
   * @return {Promise<void>} - A promise that resolves when the e-mail is sent successfully.
   */
  private async sendEmail(addressTo: string, subject: string, html: string) {
    const fromName = this.getFromName();
    this.logger.log(
      `Sending e-mail from: ${fromName} to: <${addressTo}> with subject: ${subject}`,
    );
    const result = await this.transporter.sendMail({
      from: `${fromName} <${this.configService.getOrThrow<string>(EnvironmentVariables.EMAIL_USER)}>`,
      to: addressTo,
      subject,
      html,
    });
    if (result.accepted.includes(addressTo)) {
      this.logger.log(`Successfully sent e-mail to: <${addressTo}>`);
    } else {
      this.logger.error(
        `Error while sending e-mail to: <${addressTo}>: ${result.response}`,
      );
    }
  }

  /**
   * Returns the 'fromName' value based on the current environment.
   *
   * @private
   * @return {string} The 'fromName' value.
   */
  private getFromName() {
    let fromName: string;
    const nodeEnv = this.configService.getOrThrow<string>(
      EnvironmentVariables.NODE_ENV,
    );
    if (nodeEnv === MailService.NODE_ENV_STAGING) {
      fromName = 'Staging.Jenkify';
    } else if (nodeEnv === MailService.NODE_ENV_PRODUCTION) {
      fromName = 'Jenkify';
    } else {
      fromName = 'Dev.Jenkify';
    }
    return fromName;
  }
}
