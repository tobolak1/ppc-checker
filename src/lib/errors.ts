export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public service: string,
    public requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class RateLimitError extends ApiError {
  constructor(service: string, public retryAfterMs: number) {
    super(`Rate limited by ${service}`, 429, service);
    this.name = "RateLimitError";
  }
}

export class AuthError extends ApiError {
  constructor(service: string, message = "Authentication failed") {
    super(message, 401, service);
    this.name = "AuthError";
  }
}

export class TimeoutError extends ApiError {
  constructor(service: string, timeoutMs: number) {
    super(`Request to ${service} timed out after ${timeoutMs}ms`, 408, service);
    this.name = "TimeoutError";
  }
}
