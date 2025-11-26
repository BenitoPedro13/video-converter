export interface User {
  id: string;
  email: string;
  name: string | null;
}

export class RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  user: User;
}
