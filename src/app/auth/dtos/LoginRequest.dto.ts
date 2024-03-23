import {ApiProperty} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {IsEmail, IsNotEmpty, IsString} from 'class-validator';

export class LoginRequestDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Transform((email) => email.value.toLowerCase())
    @ApiProperty({required: true})
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({required: true})
    password: string;
}
