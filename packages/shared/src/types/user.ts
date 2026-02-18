export enum UserRole {
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
