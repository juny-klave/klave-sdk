export type KlaveErrorCode =
  | 'IDENTITY_INVALID'
  | 'EXPIRED_SCOPE'
  | 'CEILING_EXCEEDED'
  | 'CATEGORY_DENIED'
  | 'BUDGET_EXCEEDED'
  | 'SCOPE_REVOKED'
  | 'REVOCATION_PROPAGATING'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_HANDOFF_NOT_SUPPORTED'
  | 'NEGOTIATION_FAILED'
  | 'NEGOTIATION_TIMEOUT'
  | 'EMPTY_CATEGORIES'
  | 'CATEGORIES_LIMIT_EXCEEDED'
  | 'BUDGET_CEILING_INCONSISTENT'
  | 'DELEGATION_NOT_SUPPORTED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'CIRCUIT_VERSION_MISMATCH'
  | 'RATE_LIMITED'
  | 'SERVICE_DEGRADED'
  | 'NETWORK_ERROR';

const RETRYABLE_CODES: ReadonlySet<KlaveErrorCode> = new Set(['RATE_LIMITED', 'SERVICE_DEGRADED', 'NETWORK_ERROR']);

export class KlaveError extends Error {
  constructor(
    message: string,
    public code: KlaveErrorCode,
    public status?: number,
    public retryable: boolean = RETRYABLE_CODES.has(code)
  ) {
    super(message);
    this.name = 'KlaveError';
  }
}
