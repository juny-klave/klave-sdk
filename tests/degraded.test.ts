import { buildClient, jsonResponse } from './helpers';

describe('degraded mode', () => {
  it('surfaces SERVICE_DEGRADED on KLAVE outage', async () => {
    const client = buildClient(async () => jsonResponse({ ok: false, status: 503, body: { code: 'SERVICE_DEGRADED' } }));
    await expect(client.startNegotiation({ scopeToken: 'tok', listingId: 'l1' })).rejects.toMatchObject({ code: 'SERVICE_DEGRADED' });
  });

  it('supports proofPending settlement responses', async () => {
    const client = buildClient(async () => jsonResponse({ ok: true, status: 200, body: { status: 'settled', sessionId: 's1', proofPending: true } }));
    await expect(client.negotiate({ scopeToken: 'tok', listingId: 'l1' })).resolves.toMatchObject({ proofPending: true });
  });
});
