# Quickstart

```ts
import { KlaveClient } from '@klave/sdk';

const client = new KlaveClient({ apiKey: process.env.KLAVE_KEY! });
const scope = await client.createAgentScope({
  buyerAgentId: 'STANDARD_BUYER',
  buyerPrincipalId: 'buyer_001',
  maxTransactionCents: 20000,
  weeklyBudgetCents: 100000,
  permittedCategories: ['travel'],
  delegationDepth: 0,
});

const result = await client.negotiate({ scopeToken: scope.token, listingId: 'flight_123' });
```
