import type { HttpClient } from "../http.js";
import {
  InvalidResponseError,
  ServiceUnavailableError,
  TimeoutError,
  UniPostError,
  ValidationError,
} from "../errors.js";
import type {
  GetManagedUserParams,
  ListManagedUsersParams,
  ManagedUser,
  ManagedUserAccount,
  ManagedUserDetail,
  ManagedUserSummary,
  PaginatedResponse,
} from "../types/index.js";

export class Users {
  constructor(private readonly http: HttpClient) {}

  /** @deprecated Prefer the Profile-scoped overload. */
  async list(): Promise<PaginatedResponse<ManagedUser>>;
  /** List managed users inside a profile. */
  async list(params: ListManagedUsersParams): Promise<PaginatedResponse<ManagedUserSummary>>;
  async list(
    params?: ListManagedUsersParams,
  ): Promise<PaginatedResponse<ManagedUser> | PaginatedResponse<ManagedUserSummary>> {
    if (params === undefined) {
      return this.http.get("/v1/users");
    }
    const profileId = encodePathSegment(params.profileId, "profileId");
    validateLimit(params.limit);
    const response = await requestManagedUserResponse(() =>
      this.http.request<unknown>(
        "GET",
        `/v1/profiles/${profileId}/users`,
        {
          query: { limit: params.limit },
          preserveErrorCode: true,
          errorContext: "managed_users",
        },
      ),
    );
    return parseManagedUserPage(response);
  }

  /** @deprecated Prefer the Profile-scoped overload. */
  async get(externalUserId: string): Promise<ManagedUser>;
  /** Get one managed user inside a profile by external_user_id. */
  async get(params: GetManagedUserParams): Promise<ManagedUserDetail>;
  async get(params: string | GetManagedUserParams): Promise<ManagedUser | ManagedUserDetail> {
    if (typeof params === "string") {
      const res = await this.http.get<{ data: ManagedUser }>(
        `/v1/users/${encodeURIComponent(params)}`,
      );
      return res.data;
    }
    const profileId = encodePathSegment(params.profileId, "profileId");
    const externalUserId = encodePathSegment(params.externalUserId, "externalUserId");
    const res = await requestManagedUserResponse(() =>
      this.http.request<unknown>(
        "GET",
        `/v1/profiles/${profileId}/users/${externalUserId}`,
        {
          preserveErrorCode: true,
          errorContext: "managed_users",
        },
      ),
    );
    return parseManagedUserDetailEnvelope(res);
  }
}

function encodePathSegment(value: string, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${field} is required`, {
      [field]: ["Must be a non-empty string"],
    });
  }

  try {
    return encodeURIComponent(value);
  } catch {
    throw new ValidationError(`${field} is invalid`, {
      [field]: ["Must be valid Unicode text"],
    });
  }
}

function validateLimit(limit: number | undefined): void {
  if (
    limit !== undefined &&
    (!Number.isInteger(limit) || limit < 1 || limit > 100)
  ) {
    throw new ValidationError("limit must be an integer between 1 and 100", {
      limit: ["Must be an integer between 1 and 100"],
    });
  }
}

function parseManagedUserPage(value: unknown): PaginatedResponse<ManagedUserSummary> {
  const page = requireRecord(value, "response");
  if (!Array.isArray(page.data)) {
    invalid("response.data", "an array");
  }

  const data = page.data.map((item, index) =>
    parseManagedUserSummary(item, `response.data[${index}]`),
  );
  validateOptionalString(page, "nextCursor", "response");

  if (page.meta !== undefined) {
    const meta = requireRecord(page.meta, "response.meta");
    validateOptionalNumber(meta, "total", "response.meta");
    validateOptionalNumber(meta, "limit", "response.meta");
    validateOptionalBoolean(meta, "has_more", "response.meta");
    validateOptionalString(meta, "next_cursor", "response.meta");
  }

  return value as PaginatedResponse<ManagedUserSummary>;
}

function parseManagedUserSummary(value: unknown, path: string): ManagedUserSummary {
  const user = requireRecord(value, path);
  requireString(user.external_user_id, `${path}.external_user_id`);
  validateOptionalString(user, "external_user_email", path);
  requireCount(user.account_count, `${path}.account_count`);
  requireCount(user.reconnect_count, `${path}.reconnect_count`);
  requireCount(user.disconnected_count, `${path}.disconnected_count`);
  requireString(user.first_connected_at, `${path}.first_connected_at`);
  validateOptionalString(user, "last_refreshed_at", path);

  const platformCounts = requireRecord(user.platform_counts, `${path}.platform_counts`);
  for (const [platform, count] of Object.entries(platformCounts)) {
    requireCount(count, `${path}.platform_counts.${platform}`);
  }

  return value as ManagedUserSummary;
}

function parseManagedUserDetailEnvelope(value: unknown): ManagedUserDetail {
  const envelope = requireRecord(value, "response");
  return parseManagedUserDetail(envelope.data, "response.data");
}

function parseManagedUserDetail(value: unknown, path: string): ManagedUserDetail {
  const user = requireRecord(value, path);
  requireString(user.external_user_id, `${path}.external_user_id`);
  validateOptionalString(user, "external_user_email", path);
  requireCount(user.account_count, `${path}.account_count`);
  if (!Array.isArray(user.accounts)) {
    invalid(`${path}.accounts`, "an array");
  }
  user.accounts.forEach((account, index) =>
    parseManagedUserAccount(account, `${path}.accounts[${index}]`),
  );
  return value as ManagedUserDetail;
}

function parseManagedUserAccount(value: unknown, path: string): ManagedUserAccount {
  const account = requireRecord(value, path);
  requireString(account.id, `${path}.id`);
  requireString(account.profile_id, `${path}.profile_id`);
  requireString(account.platform, `${path}.platform`);
  requireString(account.status, `${path}.status`);
  validateOptionalString(account, "profile_name", path);
  validateOptionalNullableString(account, "account_name", path);
  validateOptionalString(account, "external_account_id", path);
  validateOptionalString(account, "connected_at", path);
  validateOptionalString(account, "connection_type", path);
  validateOptionalString(account, "external_user_id", path);
  validateOptionalString(account, "external_user_email", path);
  if (
    account.scope !== undefined &&
    (!Array.isArray(account.scope) || account.scope.some((scope) => typeof scope !== "string"))
  ) {
    invalid(`${path}.scope`, "an array of strings");
  }
  return value as ManagedUserAccount;
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid(path, "an object");
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    invalid(path, "a string");
  }
  return value;
}

function requireCount(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    invalid(path, "a non-negative integer");
  }
  return value;
}

function validateOptionalString(
  value: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (value[key] !== undefined) {
    requireString(value[key], `${path}.${key}`);
  }
}

function validateOptionalNullableString(
  value: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (value[key] !== undefined && value[key] !== null) {
    requireString(value[key], `${path}.${key}`);
  }
}

function validateOptionalNumber(
  value: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (value[key] !== undefined && typeof value[key] !== "number") {
    invalid(`${path}.${key}`, "a number");
  }
}

function validateOptionalBoolean(
  value: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (value[key] !== undefined && typeof value[key] !== "boolean") {
    invalid(`${path}.${key}`, "a boolean");
  }
}

function invalid(path: string, expected: string): never {
  throw new InvalidResponseError(
    `Invalid UniPost response at ${path}: expected ${expected}`,
    path,
  );
}

async function requestManagedUserResponse<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidResponseError(
        "UniPost returned invalid JSON for a Managed User response",
        "response",
      );
    }
    if (
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new TimeoutError();
    }
    if (error instanceof TypeError) {
      throw new ServiceUnavailableError();
    }
    if (
      error instanceof UniPostError &&
      [502, 503, 504].includes(error.status) &&
      !(error instanceof ServiceUnavailableError)
    ) {
      throw new ServiceUnavailableError(
        error.message,
        error.status,
        error.code,
        {
          error_source: error.error_source,
          error_temporality: error.error_temporality,
          provider_error: error.provider_error,
          retry_policy: error.retry_policy,
        },
      );
    }
    throw error;
  }
}
