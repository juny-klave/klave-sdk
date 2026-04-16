import { buildClient, jsonResponse } from './helpers';

describe('negotiation flows', () => {
  it('supports one-call negotiate', async () => {
    const client = buildClient(async () =>
      jsonResponse({ ok: true, status: 200, body: { status: 'settled', sessionId: 's1', price: 1200, proofPending: true } })
    );

    const result = await client.negotiate({ scopeToken: 'tok', listingId: 'flight_123' });
    expect(result).toMatchObject({ status: 'settled', sessionId: 's1', proofPending: true });
  });

  it('fetches proof asynchronously', async () => {
    const client = buildClient(async () => jsonResponse({ ok: true, status: 200, body: { zkProof: 'proof', auditCommitment: 'hash' } }));
    const proof = await client.getProof('s1');
    expect(proof.auditCommitment).toBe('hash');
  });
});
