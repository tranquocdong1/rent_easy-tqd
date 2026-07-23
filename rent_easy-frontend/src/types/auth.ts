import { UserProfile } from '@/lib/auth-store';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  data: {
    expiresIn: number;
    user: UserProfile;
  };
}
