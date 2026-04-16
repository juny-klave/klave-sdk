import { KlaveError } from '../src/errors';
import { buildClient, jsonResponse } from './helpers';

describe('auth checks', () => {
  const rejectionCodes = ['IDENTITY_INVALID', 'EXPIRED_SCOPE', 'CEILING_EXCEEDED', 'CATEGORY_DENIED', 'BUDGET_EXCEEDED'] as const;

  it.each(rejectionCodes)('surfaces %s as typed error', async (code) => {
    const client = buildClient(async () => jsonResponse({ ok: false, status: 403, body: { code, message: code } }));
    await expect(client.startNegotiation({ scopeToken: 'tok', listingId: 'l1' })).rejects.toMatchObject({ code, retryable: false });
  });

  it('returns token metadata with keyVersion from issuance response', async () => {
    const client = buildClient(async () =>
      jsonResponse({ ok: true, status: 200, body: { token: 'abc', agentScopeId: 'id1', issuedAt: '2026-01-01', expiresAt: '2026-01-02', keyVersion: 'k1' } })
    );

    const token = await client.createAgentScope({
      buyerAgentId: 'STANDARD_BUYER',
      buyerPrincipalId: 'buyer_1',
      maxTransactionCents: 100,
      weeklyBudgetCents: 200,
      permittedCategories: ['travel'],
      delegationDepth: 0,
    });

    expect(token.keyVersion).toBe('k1');
  });

  it('marks authorization failures as non-retryable', () => {
    const error = new KlaveError('denied', 'CATEGORY_DENIED');
    expect(error.retryable).toBe(false);
  });
});
