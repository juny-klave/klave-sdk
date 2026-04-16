import { KlaveClient } from '@klave/sdk';

async function main(): Promise<void> {
  const client = new KlaveClient({ apiKey: process.env.KLAVE_KEY ?? 'demo-key', baseUrl: 'http://localhost:3000' });
  const scope = await client.createAgentScope({
    buyerAgentId: 'STANDARD_BUYER',
    buyerPrincipalId: 'buyer_001',
    maxTransactionCents: 20_000,
    weeklyBudgetCents: 100_000,
    permittedCategories: ['travel'],
    delegationDepth: 0,
  });
  const result = await client.negotiate({ scopeToken: scope.token, listingId: 'flight_123' });
  console.log(result);
}

void main();
