import { buildClient, jsonResponse } from './helpers';

describe('concurrency budget race handling', () => {
  it('surfaces budget exceeded for one concurrent start', async () => {
    let call = 0;
    const client = buildClient(async () => {
      call += 1;
      if (call === 1) {
        return jsonResponse({ ok: true, status: 200, body: { sessionId: 's1' } });
      }
      return jsonResponse({ ok: false, status: 409, body: { code: 'BUDGET_EXCEEDED', message: 'cas reject' } });
    });

    const first = client.startNegotiation({ scopeToken: 'tok', listingId: 'a' });
    const second = client.startNegotiation({ scopeToken: 'tok', listingId: 'b' });

    await expect(first).resolves.toEqual({ sessionId: 's1' });
    await expect(second).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
  });
});
