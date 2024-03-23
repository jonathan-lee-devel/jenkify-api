import {TestBed} from '@automock/jest';

import {PasswordController} from './password.controller';
import {ConfirmPasswordResetRequestDto} from '../../dtos/ConfirmPasswordResetRequest.dto';
import {ResetPasswordRequestDto} from '../../dtos/ResetPasswordRequest.dto';
import {PasswordService} from '../../services/password/password.service';

describe('PasswordController', () => {
  let controller: PasswordController;
  let mockPasswordService: jest.Mocked<PasswordService>;

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(PasswordController).compile();
    controller = unit;
    mockPasswordService = unitRef.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should reset password via service when reset password endpoint hit', async () => {
    const resetPasswordRequestDto: ResetPasswordRequestDto = {email: 'test@example.com'};

    await controller.resetPassword(resetPasswordRequestDto);

    expect(mockPasswordService.resetPassword).toHaveBeenCalledWith(resetPasswordRequestDto.email);
  });

  it('should confirm password reset via service when confirm password reset endpoint hit', async () => {
    const confirmPasswordResetRequestDto: ConfirmPasswordResetRequestDto = {
      password: 'password',
      confirmPassword: 'password',
      tokenValue: '12345',
    };

    await controller.confirmPasswordReset(confirmPasswordResetRequestDto);

    expect(mockPasswordService.confirmPasswordReset).toHaveBeenCalledWith(confirmPasswordResetRequestDto);
  });
});
