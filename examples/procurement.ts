import { KlaveClient } from '@klave/sdk';

async function runProcurement(): Promise<void> {
  const client = new KlaveClient({ apiKey: process.env.KLAVE_KEY ?? 'demo-key', baseUrl: 'http://localhost:3000' });
  const scope = await client.createAgentScope({
    buyerAgentId: 'PROCUREMENT_AGENT',
    buyerPrincipalId: 'buyer_enterprise_001',
    maxTransactionCents: 500_000,
    weeklyBudgetCents: 2_000_000,
    permittedCategories: ['equipment'],
    delegationDepth: 0,
  });

  const deal = await client.negotiate({ scopeToken: scope.token, listingId: 'equipment_777' });
  console.log('Deal status:', deal.status);
}

void runProcurement();
