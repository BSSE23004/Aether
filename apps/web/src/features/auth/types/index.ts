/**
 * Auth feature types
 */

export interface NonceRequest {
  address: string;
}

export interface NonceResponse {
  nonce: string;
  address: string;
  expiresAt: string;
}

export interface LoginRequest {
  address: string;
  signature: string;
}

export interface LoginResponse {
  user: {
    id: string;
    address: string;
    username?: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface SignupRequest {
  address: string;
  username: string;
  signature: string;
}

