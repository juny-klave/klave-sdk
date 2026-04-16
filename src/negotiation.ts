import type { KlaveClient } from './client';
import type { NegotiationParams, NegotiationResult } from './types';

export async function startNegotiation(client: KlaveClient, params: NegotiationParams): Promise<{ sessionId: string }> {
  return client.startNegotiation(params);
}

export async function submitOffer(
  client: KlaveClient,
  sessionId: string,
  offerCents: number,
  idempotencyKey?: string
): Promise<{ round: number; counterOffer?: number }> {
  return client.submitOffer(sessionId, offerCents, idempotencyKey);
}

export async function finalize(client: KlaveClient, sessionId: string, idempotencyKey?: string): Promise<NegotiationResult> {
  return client.finalize(sessionId, idempotencyKey);
}

export async function negotiate(client: KlaveClient, params: NegotiationParams): Promise<NegotiationResult> {
  return client.negotiate(params);
}

export async function getProof(client: KlaveClient, sessionId: string): Promise<{ zkProof: string; auditCommitment: string }> {
  return client.getProof(sessionId);
}
