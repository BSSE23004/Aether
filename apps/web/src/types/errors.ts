/**
 * Error types
 */

export class AetherError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AetherError';
  }
}

export class AuthError extends AetherError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('AUTH_ERROR', message, 401, details);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AetherError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AetherError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AetherError {
  constructor(message: string = 'Network error') {
    super('NETWORK_ERROR', message, 0);
    this.name = 'NetworkError';
  }
}
