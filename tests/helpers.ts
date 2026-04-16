import { KlaveClient } from '../src/client';

type MockResponseInit = {
  ok: boolean;
  status: number;
  body?: unknown;
};

export function jsonResponse(init: MockResponseInit): any {
  return {
    ok: init.ok,
    status: init.status,
    json: async () => init.body ?? {},
  } as any;
}

export function buildClient(fetchImpl: typeof fetch): KlaveClient {
  return new KlaveClient({
    apiKey: 'test-key',
    baseUrl: 'https://example.test',
    timeout: 200,
    retryPolicy: { maxAttempts: 2, backoffMs: 1, retryOn: ['RATE_LIMITED', 'SERVICE_DEGRADED', 'NETWORK_ERROR'] },
    fetchImpl,
  });
}
