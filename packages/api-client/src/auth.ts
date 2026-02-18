import type { LoginDto, RegisterDto, AuthResponse, User } from '@easyhotel/shared';
import { http } from './request';

export const authApi = {
  register: (data: RegisterDto) => http.post<AuthResponse>('/auth/register', data),

  login: (data: LoginDto) => http.post<AuthResponse>('/auth/login', data),

  getProfile: () => http.get<User>('/auth/profile'),
};
