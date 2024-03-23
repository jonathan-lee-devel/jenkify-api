export class PasswordResetAttemptEvent {
  constructor(
        public readonly email: string,
        public readonly passwordResetTokenValue: string,
  ) {}
}
