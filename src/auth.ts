import type { KlaveClient } from './client';
import type { AgentScopeParams, AgentScopeToken, RevocationPropagation, ScopeStatus } from './types';

export async function createAgentScope(client: KlaveClient, params: AgentScopeParams): Promise<AgentScopeToken> {
  return client.createAgentScope(params);
}

export async function revokeScope(client: KlaveClient, token: string): Promise<{ revokedAt: string; propagationSlaMs: number }> {
  return client.revokeScope(token);
}

export async function verifyScope(client: KlaveClient, token: string): Promise<{ status: ScopeStatus; propagation?: RevocationPropagation }> {
  return client.verifyScope(token);
}
