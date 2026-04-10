/**
 * Base error class for all UniPost API errors.
 */
export class UniPostError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "UniPostError";
    this.status = status;
    this.code = code;
  }
}

/** 401 - API key invalid or expired. */
export class AuthError extends UniPostError {
  constructor(message = "Authentication failed") {
    super(message, 401, "auth_error");
    this.name = "AuthError";
  }
}

/** 404 - Resource not found. */
export class NotFoundError extends UniPostError {
  constructor(message = "Resource not found") {
    super(message, 404, "not_found");
    this.name = "NotFoundError";
  }
}

/** 422 - Validation error. */
export class ValidationError extends UniPostError {
  readonly errors: Record<string, string[]>;

  constructor(message = "Validation failed", errors: Record<string, string[]> = {}) {
    super(message, 422, "validation_error");
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/** 429 - Rate limit exceeded. */
export class RateLimitError extends UniPostError {
  readonly retryAfter: number;

  constructor(retryAfter: number, message = "Rate limit exceeded") {
    super(message, 429, "rate_limit");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Platform-side error (e.g. Twitter rejected the post). */
export class PlatformError extends UniPostError {
  readonly platform: string;

  constructor(message: string, platform: string) {
    super(message, 502, "platform_error");
    this.name = "PlatformError";
    this.platform = platform;
  }
}

/** Monthly quota exceeded. */
export class QuotaError extends UniPostError {
  constructor(message = "Monthly quota exceeded") {
    super(message, 403, "quota_exceeded");
    this.name = "QuotaError";
  }
}

/**
 * Parse an API error response into the appropriate error class.
 */
export function parseApiError(status: number, body: { error?: { code?: string; message?: string; errors?: Record<string, string[]>; platform?: string } }): UniPostError {
  const msg = body.error?.message || "Unknown API error";
  const code = body.error?.code || "unknown";

  switch (status) {
    case 401:
      return new AuthError(msg);
    case 404:
      return new NotFoundError(msg);
    case 422:
      return new ValidationError(msg, body.error?.errors);
    case 429:
      return new RateLimitError(0, msg);
    case 403:
      if (code === "quota_exceeded") return new QuotaError(msg);
      return new UniPostError(msg, status, code);
    case 502:
      if (body.error?.platform) return new PlatformError(msg, body.error.platform);
      return new UniPostError(msg, status, code);
    default:
      return new UniPostError(msg, status, code);
  }
}
