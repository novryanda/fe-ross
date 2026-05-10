/**
 * API Client — ROSS / BuzzTrack
 *
 * All HTTP calls to the backend go through this module. Backend contract:
 *
 *   Success: { "success": true, "data": ..., "meta"?: PaginationMeta }
 *   Error:   { "success": false, "error": { code, message, details } }
 *
 * This client:
 *   - forwards the `ross.session_token` cookie (credentials: "include")
 *   - supports GET / POST / PATCH / DELETE
 *   - normalises error responses into a thrown `ApiError`
 *   - is NOT aware of mock mode; per-module adapters decide mock vs real.
 */
import { ApiError, type ApiErrorBody } from "./errors";
import type { ApiResponse } from "./types";
import { getApiMode } from "@/lib/auth/session";

// ---------- Base URL resolution ----------

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

/**
 * Prefers `NEXT_PUBLIC_API_BASE_URL` (full URL incl. `/api/v1`). Falls back
 * to `NEXT_PUBLIC_API_URL + /api/v1` for backward compatibility. Final
 * fallback hits a localhost default so dev boots without env.
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && explicit.trim().length > 0)
    return stripTrailingSlash(explicit);

  const origin = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (origin) return `${stripTrailingSlash(origin)}/api/v1`;

  return "http://localhost:3001/api/v1";
}

/**
 * Origin of the backend without any path prefix. Used for endpoints that
 * live OUTSIDE `/api/v1` (e.g. native Better Auth routes `/api/auth/*`).
 */
function resolveApiOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (base) return stripTrailingSlash(base).replace(/\/api\/v\d+$/, "");

  return "http://localhost:3001";
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_ORIGIN = resolveApiOrigin();

// ---------- Mock helper (preserved for adapters that branch on mode) ----------

export const isMockMode = () => getApiMode() === "mock";

// ---------- Request helpers ----------

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.append(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  /** Override base URL (used for native Better Auth calls). */
  baseUrl?: string;
  /** Extra fetch init (rarely needed). */
  init?: RequestInit;
  /** Headers merged with the defaults. */
  headers?: HeadersInit;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  query?: QueryParams,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const base = options?.baseUrl ?? API_BASE_URL;
  const url = `${base}${path}${buildQueryString(query)}`;
  const hasBody = body !== undefined && method !== "GET";

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...options?.headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      ...options?.init,
    });
  } catch (cause) {
    // Network failure, CORS reject, DNS error, etc.
    throw new ApiError(
      "NETWORK_ERROR",
      cause instanceof Error
        ? cause.message
        : "Tidak dapat menghubungi server.",
      [],
    );
  }

  // 204 No Content: synthesise an empty envelope.
  if (response.status === 204) {
    return { success: true, data: undefined as unknown as T };
  }

  // Parse JSON defensively. Some error paths return plain text.
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      defaultErrorCode(response.status),
      response.statusText || `Request failed with status ${response.status}.`,
      [],
      response.status,
    );
  }

  if (!response.ok || isErrorEnvelope(json)) {
    const errorBody: ApiErrorBody | undefined = isErrorEnvelope(json)
      ? json.error
      : undefined;
    throw ApiError.from(
      errorBody ?? {
        code: defaultErrorCode(response.status),
        message: response.statusText || "Request failed.",
      },
      response.status,
    );
  }

  // Success envelope
  if (isSuccessEnvelope<T>(json)) {
    return json;
  }

  // Legacy / non-envelope success (rare): coerce into the canonical envelope.
  return { success: true, data: json as T };
}

function isSuccessEnvelope<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === true
  );
}

function isErrorEnvelope(
  value: unknown,
): value is { success: false; error: ApiErrorBody } {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === false &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "object"
  );
}

function defaultErrorCode(status: number): string {
  if (status === 400) return "VALIDATION_ERROR";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status >= 500) return "INTERNAL_SERVER_ERROR";
  return "REQUEST_ERROR";
}

// ---------- Public API ----------

export const apiClient = {
  get: <T>(path: string, query?: QueryParams, options?: RequestOptions) =>
    request<T>("GET", path, undefined, query, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, undefined, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, undefined, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, undefined, options),
  /**
   * Escape hatch for endpoints that live outside `/api/v1` (e.g. native
   * Better Auth routes `/api/auth/sign-in/email`). Uses the backend origin
   * directly while preserving credentials handling.
   */
  fetchFromOrigin: async <T>(path: string, init?: RequestInit): Promise<T> => {
    const url = `${API_ORIGIN}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
        ...init,
      });
    } catch (cause) {
      throw new ApiError(
        "NETWORK_ERROR",
        cause instanceof Error
          ? cause.message
          : "Tidak dapat menghubungi server.",
        [],
      );
    }

    if (response.status === 204) return undefined as unknown as T;

    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      if (!response.ok) {
        throw new ApiError(
          defaultErrorCode(response.status),
          response.statusText,
          [],
          response.status,
        );
      }
      return undefined as unknown as T;
    }

    if (!response.ok) {
      if (isErrorEnvelope(json))
        throw ApiError.from(json.error, response.status);
      const record =
        typeof json === "object" && json !== null
          ? (json as Record<string, unknown>)
          : {};
      const message =
        typeof record.message === "string"
          ? record.message
          : response.statusText;
      const code =
        typeof record.code === "string"
          ? record.code
          : defaultErrorCode(response.status);
      throw new ApiError(code, message, [], response.status);
    }

    return json as T;
  },
};

// Re-export error types for convenient imports.
export {
  ApiError,
  isApiError,
  getErrorMessage,
  mapApiErrorToToastMessage,
} from "./errors";
export type { ApiResponse, PaginationMeta, PaginatedResponse } from "./types";

/**
 * Legacy alias kept for backward compatibility with existing call sites that
 * import `ApiClientError` from `@/lib/api/client`. New code should import
 * `ApiError` from `@/lib/api/errors` (or this file) directly.
 *
 * @deprecated Use `ApiError` instead.
 */
export const ApiClientError = ApiError;
