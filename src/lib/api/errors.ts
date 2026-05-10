/**
 * Shared error types for the ROSS API client.
 *
 * The backend returns this envelope on failure:
 *
 *   {
 *     "success": false,
 *     "error": {
 *       "code": "ERROR_CODE",
 *       "message": "Human readable message",
 *       "details": []
 *     }
 *   }
 */

export interface ApiErrorDetail {
  field?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export class ApiError extends Error {
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly status?: number;

  constructor(
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    status?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }

  static from(body: ApiErrorBody | undefined, status?: number): ApiError {
    const code = body?.code ?? "UNKNOWN_ERROR";
    const message = body?.message ?? "An unknown error occurred.";
    return new ApiError(code, message, body?.details ?? [], status);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Human-friendly message extraction. Falls back to a generic message so UI
 * never shows `[object Object]` or `undefined`.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
): string {
  if (isApiError(error)) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error;
  return fallback;
}

/**
 * Map a subset of known backend error codes to friendlier Indonesian toast
 * messages. Pages are free to handle specific codes explicitly; this helper
 * is just the default for generic catch blocks.
 */
export function mapApiErrorToToastMessage(error: unknown): string {
  if (!isApiError(error)) return getErrorMessage(error);

  switch (error.code) {
    case "UNAUTHORIZED":
      return "Sesi Anda sudah berakhir. Silakan login kembali.";
    case "FORBIDDEN":
      return "Anda tidak memiliki akses untuk tindakan ini.";
    case "NOT_FOUND":
      return "Data yang diminta tidak ditemukan.";
    case "VALIDATION_ERROR":
      return error.details[0]?.message ?? "Input tidak valid.";
    case "CONFLICT":
      return "Terjadi konflik data. Muat ulang halaman lalu coba lagi.";
    case "EMAIL_ALREADY_IN_USE":
      return "Email sudah digunakan oleh user lain.";
    case "LAST_ACTIVE_ADMIN":
      return "Tidak bisa menonaktifkan admin aktif terakhir.";
    case "CANNOT_DEACTIVATE_SELF":
      return "Admin tidak dapat menonaktifkan dirinya sendiri.";
    case "ATTEMPT_ALREADY_KEPT":
    case "COMMENT_TASK_ALREADY_KEPT":
      return "Tugas ini sudah diambil buzzer lain. Refresh halaman untuk data terbaru.";
    case "COMMENT_TASK_KEEP_EXPIRED":
      return "Waktu keep sudah habis. Ambil tugas baru dari queue.";
    case "COMMENT_COMMAND_NOT_ACTIVE":
      return "Command ini tidak aktif lagi. Muat ulang queue.";
    case "PASSWORD_CONFIRMATION_MISMATCH":
      return "Konfirmasi password baru tidak cocok.";
    case "PASSWORD_UNCHANGED":
      return "Password baru harus berbeda dari password saat ini.";
    case "INVALID_PASSWORD":
      return "Password saat ini salah.";
    default:
      return error.message || "Permintaan gagal. Silakan coba lagi.";
  }
}
