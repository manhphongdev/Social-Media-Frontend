export interface User {
  id: number;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string | null;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  dateOfBirth: string; // Format: YYYY-MM-DD
}

export interface RegisterResponse {
  status: number;
  message: string;
  timestamp: string;
  data?: {
    accessToken: string;
    authenticate: boolean;
    user?: User;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  timestamp: string;
  data?: {
    accessToken: string;
    authenticate: boolean;
    user?: User;
  };
}

export interface ProfileResponse {
  status: number;
  message: string;
  timestamp: string;
  data: User;
}
