import { KlaveClient } from '@klave/sdk';

async function runTravelFlow(): Promise<void> {
  const client = new KlaveClient({ apiKey: process.env.KLAVE_KEY ?? 'demo-key', baseUrl: 'http://localhost:3000' });
  const scope = await client.createAgentScope({
    buyerAgentId: 'STANDARD_BUYER',
    buyerPrincipalId: 'buyer_001',
    maxTransactionCents: 45_000,
    weeklyBudgetCents: 200_000,
    permittedCategories: ['travel', 'lodging'],
    delegationDepth: 0,
  });
  const session = await client.startNegotiation({ scopeToken: scope.token, listingId: 'flight_123' });
  await client.submitOffer(session.sessionId, 40_000);
  const settled = await client.finalize(session.sessionId);
  if (settled.proofPending) {
    console.log(await client.getProof(session.sessionId));
  }
}

void runTravelFlow();
