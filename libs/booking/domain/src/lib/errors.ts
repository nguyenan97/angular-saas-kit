/** Why a Booking operation was refused. The UI maps each code to a message. */
export type DomainErrorCode =
  | 'empty-order'
  | 'slot-in-past'
  | 'slot-full'
  | 'invalid-transition'
  | 'reason-required'
  | 'not-draft'
  | 'invalid-quantity'
  | 'currency-mismatch'
  | 'negative-discount'
  | 'invalid-price'
  | 'discount-too-large'
  | 'duplicate-line'
  | 'line-not-found';

export interface DomainError {
  readonly code: DomainErrorCode;
  /** For logs and developers; the UI shows its own text for the code. */
  readonly detail: string;
}

export function domainError(
  code: DomainErrorCode,
  detail: string,
): DomainError {
  return { code, detail };
}
