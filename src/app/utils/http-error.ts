import { HttpErrorResponse } from '@angular/common/http';

/** The API's `{ error }` message, or `fallback` for network failures and unexpected shapes. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    if (typeof error.error?.error === 'string') return error.error.error;
  }
  return fallback;
}

/** The API's machine-readable `code` (e.g. `EMAIL_NOT_VERIFIED`), if any. */
export function apiErrorCode(error: unknown): string | undefined {
  return error instanceof HttpErrorResponse ? error.error?.code : undefined;
}
