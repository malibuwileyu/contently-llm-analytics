export interface User {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResult {
  data: AuthResponse;
  error: AuthError | null;
}
