export interface AuthResponse {
  token: string;
  role: string;
  username: string;
}

export interface User {
  username: string;
  role: string;
}

export interface ValidateResponse {
  valid: boolean;
  username?: string;
  role?: string;
}
