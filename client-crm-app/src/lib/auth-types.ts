export interface AuthSession {
  isAuthenticated: boolean;
  exp?: number;
}

export interface JWTPayload {
  isAuthenticated: boolean;
  exp: number;
}
