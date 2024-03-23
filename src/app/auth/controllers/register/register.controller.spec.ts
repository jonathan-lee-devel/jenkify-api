import {TestBed} from '@automock/jest';

import {RegisterController} from './register.controller';
import {RegistrationStatusResponse} from '../../constants/registration';
import {ConfirmRegisterRequestDto} from '../../dtos/ConfirmRegisterRequest.dto';
import {RegisterRequestDto} from '../../dtos/RegisterRequest.dto';
import {RegistrationService} from '../../services/registration/registration.service';

describe('RegisterController', () => {
  let controller: RegisterController;
  let mockRegistrationService: jest.Mocked<RegistrationService>;

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(RegisterController).compile();
    controller = unit;
    mockRegistrationService = unitRef.get<RegistrationService>(RegistrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register user using service when register user', async () => {
    const registerRequestDto: RegisterRequestDto = {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      isAcceptTermsAndConditions: true,
    };
    await controller.register(registerRequestDto);
    expect(mockRegistrationService.registerUser).toHaveBeenCalledWith(registerRequestDto);
  });

  it('should return register user service result when register user', async () => {
    const registerRequestDto: RegisterRequestDto = {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      isAcceptTermsAndConditions: true,
    };
    const registrationStatusResponse: RegistrationStatusResponse = {status: 'AWAITING_EMAIL_VERIFICATION'};
    mockRegistrationService.registerUser.mockResolvedValue(registrationStatusResponse);
    const result = await controller.register(registerRequestDto);
    expect(result).toStrictEqual(registrationStatusResponse);
  });

  it('should confirm registration using service when confirm registration', async () => {
    const confirmRegisterRequestDto: ConfirmRegisterRequestDto = {
      tokenValue: '',
    };
    await controller.confirmRegister(confirmRegisterRequestDto);
    expect(mockRegistrationService.confirmRegistration).toHaveBeenCalledWith(confirmRegisterRequestDto);
  });

  it('should return confirm register user service result when confirm register user', async () => {
    const confirmRegisterRequestDto: ConfirmRegisterRequestDto = {
      tokenValue: '',
    };
    const confirmRegistrationResponse: RegistrationStatusResponse = {status: 'SUCCESS'};
    mockRegistrationService.confirmRegistration.mockResolvedValue(confirmRegistrationResponse);
    const result = await controller.confirmRegister(confirmRegisterRequestDto);
    expect(result).toStrictEqual(confirmRegistrationResponse);
  });
});
