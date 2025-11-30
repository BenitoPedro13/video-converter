import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6) // Example: minimum password length
  password: string;

  @IsString()
  name?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  user: User;
}
