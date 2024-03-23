import {ApiProperty} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {IsBoolean, IsEmail, IsNotEmpty, IsString} from 'class-validator';

import {Match} from '../../../data/match.validator';

export class RegisterRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform((email) => email.value.toLowerCase())
  @ApiProperty({required: true})
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({required: true})
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({required: true})
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({required: true})
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match(
    RegisterRequestDto,
    (dto) => dto.password,
    {message: 'Passwords must match'},
  )
  @ApiProperty({required: true})
  confirmPassword: string;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({value}) => value === true)
  @ApiProperty({required: true})
  isAcceptTermsAndConditions: boolean;
}
