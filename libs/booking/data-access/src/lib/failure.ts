import { HttpErrorResponse } from '@angular/common/http';
import type {
  BookingErrorBody,
  BookingErrorCode,
} from '@angular-saas-kit/booking-contracts';

/**
 * Why a Booking request failed, as the UI tells it apart: a business refusal
 * (a 4xx with a code, shown with the code's message over the form) or anything
 * else (no answer, a 5xx: one banner with a Retry button).
 */
export type BookingFailure =
  | {
      readonly kind: 'business';
      readonly code: BookingErrorCode;
      readonly message: string;
    }
  | { readonly kind: 'network'; readonly status: number };

function isErrorBody(body: unknown): body is BookingErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as { code?: unknown }).code === 'string'
  );
}

export function toFailure(error: unknown): BookingFailure {
  if (!(error instanceof HttpErrorResponse)) {
    return { kind: 'network', status: 0 };
  }
  const { status, error: body } = error;
  if (status >= 400 && status < 500 && isErrorBody(body)) {
    return { kind: 'business', code: body.code, message: body.message };
  }
  return { kind: 'network', status };
}
