import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString, MaxLength, MinLength} from 'class-validator';

import {RandomGenerator} from '../../../constants/auth.constants';

export class ConfirmRegisterRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(RandomGenerator.DEFAULT_TOKEN_LENGTH)
    @MaxLength(RandomGenerator.DEFAULT_TOKEN_LENGTH)
    @ApiProperty({required: true})
    tokenValue: string;
}
