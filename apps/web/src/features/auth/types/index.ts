/**
 * Auth feature types
 */

export interface LoginRequest {
  address: string;
  signature: string;
  message: string;
}

export interface LoginResponse {
  user: {
    id: string;
    address: string;
    username?: string;
    avatar?: string;
  };
  token: string;
}

export interface SignupRequest {
  address: string;
  username: string;
  signature: string;
}
