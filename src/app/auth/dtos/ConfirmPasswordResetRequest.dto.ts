import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString, MaxLength, MinLength} from 'class-validator';

import {RandomGenerator} from '../../../constants/auth.constants';
import {Match} from '../../../data/match.validator';

export class ConfirmPasswordResetRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(RandomGenerator.DEFAULT_TOKEN_LENGTH)
    @MaxLength(RandomGenerator.DEFAULT_TOKEN_LENGTH)
    @ApiProperty({required: true})
    tokenValue: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @ApiProperty({required: true})
    password: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Match(
      ConfirmPasswordResetRequestDto,
      (dto) => dto.password,
      {message: 'Passwords must match'},
    )
    @ApiProperty({required: true})
    confirmPassword: string;
}
