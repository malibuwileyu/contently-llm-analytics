export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: any;
  } | null;
  error: {
    message: string;
  } | null;
}

export interface AuthDto {
  email: string;
  password: string;
}

export interface GoogleAuthDto {
  accessToken: string;
  refreshToken: string;
} 