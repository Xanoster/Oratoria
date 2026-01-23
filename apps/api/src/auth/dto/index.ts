import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SignUpDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsString()
    name?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class MagicLinkDto {
    @IsEmail()
    email: string;
}
