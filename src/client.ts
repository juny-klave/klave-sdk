import { KlaveError, type KlaveErrorCode } from './errors';
import { generateIdempotencyKey, withRetry } from './idempotency';
import { emitTelemetry } from './telemetry';
import type {
  AgentScopeParams,
  AgentScopeToken,
  KlaveConfig,
  NegotiationParams,
  NegotiationResult,
  RevocationPropagation,
  ScopeStatus,
  VerifyParams,
  VerifyResult,
} from './types';

interface ErrorResponse {
  code?: KlaveErrorCode;
  message?: string;
}

const DEFAULT_BASE_URL = 'https://api.klave.com';

export class KlaveClient {
  private readonly config: KlaveConfig & { apiKey: string; baseUrl: string; timeout: number; fetchImpl: typeof fetch; retryPolicy: NonNullable<KlaveConfig['retryPolicy']> };

  constructor(config: KlaveConfig) {
    this.config = {
      ...config,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      timeout: config.timeout ?? 15_000,
      retryPolicy: config.retryPolicy ?? { maxAttempts: 3, backoffMs: 250, retryOn: ['RATE_LIMITED', 'SERVICE_DEGRADED', 'NETWORK_ERROR'] },
      telemetryHook: config.telemetryHook,
      fetchImpl: config.fetchImpl ?? fetch,
    };
  }

  private async request<T>(
    path: string,
    options: RequestInit,
    idempotencyKey?: string
  ): Promise<T> {
    const execute = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      try {
        const response = await this.config.fetchImpl(`${this.config.baseUrl}${path}`, {
          ...options,
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
            ...(options.headers ?? {}),
          },
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as ErrorResponse;
          const code = payload.code ?? this.mapStatusToError(response.status);
          const retryable = code === 'RATE_LIMITED' || code === 'SERVICE_DEGRADED';
          throw new KlaveError(payload.message ?? `Request failed with status ${response.status}`, code, response.status, retryable);
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof KlaveError) {
          throw error;
        }
        throw new KlaveError((error as Error).message, 'NETWORK_ERROR', undefined, true);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    return withRetry(execute, this.config.retryPolicy);
  }

  private mapStatusToError(status: number): KlaveErrorCode {
    if (status === 429) {
      return 'RATE_LIMITED';
    }
    if (status >= 500) {
      return 'SERVICE_DEGRADED';
    }
    return 'NEGOTIATION_FAILED';
  }

  async createAgentScope(params: AgentScopeParams): Promise<AgentScopeToken> {
    const token = await this.request<AgentScopeToken>('/v1/agent-scope/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    emitTelemetry(this.config.telemetryHook, { type: 'scope_created', categories: params.permittedCategories, expiresAt: token.expiresAt });
    return token;
  }

  async verifyScope(token: string): Promise<{ status: ScopeStatus; propagation?: RevocationPropagation }> {
    const result = await this.request<{ status: ScopeStatus; propagation?: RevocationPropagation }>('/v1/agent-scope/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    emitTelemetry(this.config.telemetryHook, { type: 'scope_validated', status: result.status });
    if (result.status === 'revocation_propagating' && result.propagation) {
      emitTelemetry(this.config.telemetryHook, {
        type: 'revocation_propagating',
        agentId: token,
        windowRemainingMs: result.propagation.windowRemainingMs,
      });
    }
    return result;
  }

  async revokeScope(token: string): Promise<{ revokedAt: string; propagationSlaMs: number }> {
    const result = await this.request<{ revokedAt: string; propagationSlaMs: number }>('/v1/agent-scope/revoke', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    emitTelemetry(this.config.telemetryHook, { type: 'scope_revoked' });
    return result;
  }

  async startNegotiation(params: NegotiationParams): Promise<{ sessionId: string }> {
    const idempotencyKey = params.idempotencyKey ?? generateIdempotencyKey();
    const result = await this.request<{ sessionId: string }>('/v1/negotiation/start', {
      method: 'POST',
      body: JSON.stringify({ scopeToken: params.scopeToken, listingId: params.listingId }),
    }, idempotencyKey);

    emitTelemetry(this.config.telemetryHook, { type: 'negotiation_started', sessionId: result.sessionId, category: params.listingId });
    return result;
  }

  async submitOffer(sessionId: string, offerCents: number, idempotencyKey: string = generateIdempotencyKey()): Promise<{ round: number; counterOffer?: number }> {
    const result = await this.request<{ round: number; counterOffer?: number }>('/v1/negotiation/offer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, offerCents }),
    }, idempotencyKey);
    emitTelemetry(this.config.telemetryHook, { type: 'offer_submitted', sessionId, round: result.round });
    return result;
  }

  async finalize(sessionId: string, idempotencyKey: string = generateIdempotencyKey()): Promise<NegotiationResult> {
    const startedAt = Date.now();
    const result = await this.request<NegotiationResult>('/v1/negotiation/finalize', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }, idempotencyKey);

    if (result.status === 'settled') {
      emitTelemetry(this.config.telemetryHook, {
        type: 'negotiation_settled',
        sessionId,
        roundCount: 0,
        durationMs: Date.now() - startedAt,
      });
    } else {
      emitTelemetry(this.config.telemetryHook, { type: 'negotiation_failed', sessionId, reason: 'NEGOTIATION_FAILED' });
    }

    return result;
  }

  async negotiate(params: NegotiationParams): Promise<NegotiationResult> {
    const startedAt = Date.now();
    const idempotencyKey = params.idempotencyKey ?? generateIdempotencyKey();
    const result = await this.request<NegotiationResult>('/v1/negotiation/auto', {
      method: 'POST',
      body: JSON.stringify({ scopeToken: params.scopeToken, listingId: params.listingId }),
    }, idempotencyKey);

    if (result.status === 'settled') {
      emitTelemetry(this.config.telemetryHook, {
        type: 'negotiation_settled',
        sessionId: result.sessionId,
        roundCount: 0,
        durationMs: Date.now() - startedAt,
      });
    }
    return result;
  }

  async getProof(sessionId: string): Promise<{ zkProof: string; auditCommitment: string }> {
    const startedAt = Date.now();
    const result = await this.request<{ zkProof: string; auditCommitment: string }>(`/v1/negotiation/${sessionId}/proof`, {
      method: 'GET',
    });
    emitTelemetry(this.config.telemetryHook, { type: 'proof_ready', sessionId, durationMs: Date.now() - startedAt });
    return result;
  }

  async verifyProof(params: VerifyParams): Promise<VerifyResult> {
    if (!params.circuitVersion) {
      throw new KlaveError('circuitVersion is required', 'CIRCUIT_VERSION_MISMATCH');
    }
    return this.request<VerifyResult>('/v1/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
