import { buildClient, jsonResponse } from './helpers';

describe('issuance validation errors', () => {
  it.each(['EMPTY_CATEGORIES', 'CATEGORIES_LIMIT_EXCEEDED', 'BUDGET_CEILING_INCONSISTENT', 'DELEGATION_NOT_SUPPORTED'] as const)(
    'surfaces %s',
    async (code) => {
      const client = buildClient(async () => jsonResponse({ ok: false, status: 400, body: { code, message: code } }));
      await expect(
        client.createAgentScope({
          buyerAgentId: 'STANDARD_BUYER',
          buyerPrincipalId: 'buyer_1',
          maxTransactionCents: 100,
          weeklyBudgetCents: 100,
          permittedCategories: ['travel'],
          delegationDepth: 0,
        })
      ).rejects.toMatchObject({ code, retryable: false });
    }
  );
});
