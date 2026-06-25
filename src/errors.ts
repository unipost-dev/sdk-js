import type {
  ErrorSource,
  ErrorTemporality,
  ProviderError,
  RetryPolicy,
} from "./types/posts.js";

export interface ErrorContract {
  error_source?: ErrorSource;
  error_temporality?: ErrorTemporality;
  provider_error?: ProviderError | null;
  retry_policy?: RetryPolicy | null;
}

/**
 * Base error class for all UniPost API errors.
 */
export class UniPostError extends Error {
  readonly status: number;
  readonly code: string;
  readonly error_source?: ErrorSource;
  readonly error_temporality?: ErrorTemporality;
  readonly provider_error?: ProviderError | null;
  readonly retry_policy?: RetryPolicy | null;

  constructor(message: string, status: number, code: string, contract: ErrorContract = {}) {
    super(message);
    this.name = "UniPostError";
    this.status = status;
    this.code = code;
    this.error_source = contract.error_source;
    this.error_temporality = contract.error_temporality;
    this.provider_error = contract.provider_error;
    this.retry_policy = contract.retry_policy;
  }
}

/** 401 - API key invalid or expired. */
export class AuthError extends UniPostError {
  constructor(message = "Authentication failed", contract: ErrorContract = {}) {
    super(message, 401, "auth_error", contract);
    this.name = "AuthError";
  }
}

/** 404 - Resource not found. */
export class NotFoundError extends UniPostError {
  constructor(message = "Resource not found", contract: ErrorContract = {}) {
    super(message, 404, "not_found", contract);
    this.name = "NotFoundError";
  }
}

/** 422 - Validation error. */
export class ValidationError extends UniPostError {
  readonly errors: Record<string, string[]>;

  constructor(
    message = "Validation failed",
    errors: Record<string, string[]> = {},
    contract: ErrorContract = {},
  ) {
    super(message, 422, "validation_error", contract);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/** 429 - Rate limit exceeded. */
export class RateLimitError extends UniPostError {
  readonly retryAfter: number;

  constructor(retryAfter: number, message = "Rate limit exceeded", contract: ErrorContract = {}) {
    super(message, 429, "rate_limit", contract);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Platform-side error (e.g. Twitter rejected the post). */
export class PlatformError extends UniPostError {
  readonly platform: string;

  constructor(message: string, platform: string, contract: ErrorContract = {}) {
    super(message, 502, "platform_error", contract);
    this.name = "PlatformError";
    this.platform = platform;
  }
}

/** Monthly quota exceeded. */
export class QuotaError extends UniPostError {
  constructor(message = "Monthly quota exceeded", contract: ErrorContract = {}) {
    super(message, 403, "quota_exceeded", contract);
    this.name = "QuotaError";
  }
}

interface ApiErrorBody {
  error?: {
    code?: string;
    normalized_code?: string;
    message?: string;
    errors?: Record<string, string[]>;
    platform?: string;
    retry_after?: number | string;
    error_source?: ErrorSource;
    error_temporality?: ErrorTemporality;
    provider_error?: ProviderError | null;
    retry_policy?: RetryPolicy | null;
  };
}

/**
 * Parse an API error response into the appropriate error class.
 */
export function parseApiError(status: number, body: ApiErrorBody): UniPostError {
  const msg = body?.error?.message || "Unknown API error";
  const code = body?.error?.normalized_code || body?.error?.code || "unknown";
  const contract: ErrorContract = {
    error_source: body?.error?.error_source,
    error_temporality: body?.error?.error_temporality,
    provider_error: body?.error?.provider_error,
    retry_policy: body?.error?.retry_policy,
  };

  switch (status) {
    case 401:
      return new AuthError(msg, contract);
    case 404:
      return new NotFoundError(msg, contract);
    case 422:
      return new ValidationError(msg, body?.error?.errors || {}, contract);
    case 429: {
      const retryAfter = parseInt(String(body?.error?.retry_after ?? "1"), 10);
      return new RateLimitError(retryAfter, msg, contract);
    }
    case 403:
      if (code === "quota_exceeded") return new QuotaError(msg, contract);
      return new UniPostError(msg, status, code, contract);
    case 502:
      if (body?.error?.platform) return new PlatformError(msg, body.error.platform, contract);
      return new UniPostError(msg, status, code, contract);
    default:
      return new UniPostError(msg, status, code, contract);
  }
}
