export interface User {
  id: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
  googleProfile?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  tokentype: string;
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
