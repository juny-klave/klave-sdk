import type { KlaveErrorCode } from './errors';

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  retryOn: KlaveErrorCode[];
}

export type ScopeStatus = 'active' | 'expired' | 'revoked' | 'revocation_propagating';

export type SpendState = 'reserved' | 'committed' | 'released';

export type DelegationDepth = 0;

export interface RevocationPropagation {
  revokedAt: string;
  propagationSlaMs: number;
  windowRemainingMs: number;
}

export type TelemetryEvent =
  | { type: 'scope_created'; categories: string[]; expiresAt: string }
  | { type: 'scope_validated'; status: ScopeStatus }
  | { type: 'scope_revoked' }
  | { type: 'negotiation_started'; sessionId: string; category: string }
  | { type: 'negotiation_settled'; sessionId: string; roundCount: number; durationMs: number }
  | { type: 'negotiation_failed'; sessionId: string; reason: KlaveErrorCode }
  | { type: 'offer_submitted'; sessionId: string; round: number }
  | { type: 'proof_ready'; sessionId: string; durationMs: number }
  | { type: 'anomaly_signal'; sessionId: string; signal: 'near_grinding' | 'near_velocity' | 'suspicious_sequence' }
  | { type: 'budget_reserved'; agentId: string }
  | { type: 'budget_committed'; agentId: string }
  | { type: 'budget_released'; agentId: string }
  | { type: 'budget_check_failed'; agentId: string }
  | { type: 'revocation_propagating'; agentId: string; windowRemainingMs: number }
  | { type: 'key_version_used'; keyVersion: string };

export interface TelemetryHook {
  onEvent(event: TelemetryEvent): void;
}

export interface KlaveConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  telemetryHook?: TelemetryHook;
  fetchImpl?: typeof fetch;
}

export interface AgentScopeParams {
  buyerAgentId: string;
  buyerPrincipalId: string;
  maxTransactionCents: number;
  weeklyBudgetCents: number;
  permittedCategories: string[];
  delegationDepth?: DelegationDepth;
  expiresAt?: string;
}

export interface AgentScopeToken {
  readonly token: string;
  readonly agentScopeId: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly keyVersion: string;
}

export interface NegotiationParams {
  scopeToken: string;
  listingId: string;
  idempotencyKey?: string;
}

export interface NegotiationResult {
  status: 'settled' | 'failed' | 'timeout';
  price?: number;
  zkProof?: string;
  auditCommitment?: string;
  sessionId: string;
  proofPending?: boolean;
}

export interface VerifyParams {
  proof: string;
  publicInputs: Record<string, string | number | boolean>;
  circuitVersion: string;
}

export interface VerifyResult {
  valid: boolean;
  policyCompliant: boolean;
  auditHash: string;
  circuitVersion: string;
}
