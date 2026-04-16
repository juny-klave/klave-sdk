import { KlaveError } from '../src/errors';
import { withRetry } from '../src/idempotency';
import { buildClient, jsonResponse } from './helpers';

describe('retry and idempotency semantics', () => {
  it('retries on 5xx once and then succeeds', async () => {
    let calls = 0;
    const client = buildClient(async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ ok: false, status: 503, body: { code: 'SERVICE_DEGRADED', message: 'try later' } });
      }
      return jsonResponse({ ok: true, status: 200, body: { sessionId: 's1' } });
    });

    const result = await client.startNegotiation({ scopeToken: 'tok', listingId: 'l1' });
    expect(result.sessionId).toBe('s1');
    expect(calls).toBe(2);
  });

  it('does not retry authorization errors', async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw new KlaveError('denied', 'CATEGORY_DENIED');
        },
        { maxAttempts: 3, backoffMs: 1, retryOn: ['RATE_LIMITED', 'SERVICE_DEGRADED', 'NETWORK_ERROR'] }
      )
    ).rejects.toMatchObject({ code: 'CATEGORY_DENIED' });
    expect(calls).toBe(1);
  });
});
