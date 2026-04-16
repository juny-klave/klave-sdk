import { buildClient, jsonResponse } from './helpers';

describe('revocation behavior', () => {
  it('returns revocation propagation metadata', async () => {
    const client = buildClient(async () =>
      jsonResponse({
        ok: true,
        status: 200,
        body: { status: 'revocation_propagating', propagation: { revokedAt: '2026-01-01', propagationSlaMs: 1000, windowRemainingMs: 500 } },
      })
    );

    const status = await client.verifyScope('tok');
    expect(status.status).toBe('revocation_propagating');
    expect(status.propagation?.windowRemainingMs).toBe(500);
  });

  it('fails closed on degraded revocation service', async () => {
    const client = buildClient(async () => jsonResponse({ ok: false, status: 503, body: { code: 'SERVICE_DEGRADED', message: 'revocation unavailable' } }));
    await expect(client.verifyScope('tok')).rejects.toMatchObject({ code: 'SERVICE_DEGRADED' });
  });
});
