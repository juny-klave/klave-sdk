# @klave/sdk

OAuth for AI agents.

`@klave/sdk` implements KLAVE's Agent Authorization Protocol (AAP) — a typed, retry-safe client that lets your autonomous agent negotiate prices within cryptographically enforced bounds.

---

## The problem it solves

When an AI agent buys something on your behalf, you need guarantees:
- The agent cannot spend more than you authorized (ceiling enforcement)
- The seller never learns your ceiling (privacy)
- Every negotiation produces a verifiable audit trail (ZK proof)
- Compromised agents can be revoked before they transact (revocation)

AAP issues a signed token that encodes these constraints before the agent touches any API. The KLAVE server enforces them. Your code just calls `createAgentScope` + `negotiate`.

---

## Install

```bash
npm install @klave/sdk
```

---

## Quick start

```typescript
import { KlaveClient } from '@klave/sdk';

const client = new KlaveClient({ apiKey: process.env.KLAVE_KEY! });

// Issue an AgentScope token binding the agent to your constraints
const scope = await client.createAgentScope({
  buyerAgentId: 'agent_abc',
  buyerPrincipalId: 'user_123',
  maxTransactionCents: 500_000,     // $5,000 ceiling — never sent to seller
  weeklyBudgetCents: 2_000_000,     // $20,000 weekly cap
  permittedCategories: ['FREIGHT', 'COMMODITIES'],
  delegationDepth: 0,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

// Negotiate — the server enforces the ceiling from the token
const result = await client.negotiate({
  scopeToken: scope.token,
  listingId: 'listing_shanghai_rotterdam',
});

if (result.status === 'settled') {
  console.log(`Settled at $${(result.price! / 100).toFixed(2)}`);
  console.log(`ZK proof: ${result.zkProof}`);
}
```

---

## Token fields

| Field | Type | Description |
|---|---|---|
| `buyerAgentId` | `string` | Identifier for the AI agent instance |
| `buyerPrincipalId` | `string` | The human user the agent acts on behalf of |
| `maxTransactionCents` | `number` | Per-transaction ceiling in cents — cryptographically bound |
| `weeklyBudgetCents` | `number` | Rolling weekly spend cap across all sessions |
| `permittedCategories` | `string[]` | Which commodity/service categories the agent may negotiate. Empty = all. |
| `delegationDepth` | `0` | Sub-delegation depth (currently `0` only) |
| `expiresAt` | `string` (ISO 8601) | Token expiry |

---

## Scope management

```typescript
// Check scope status (detects revocation propagation)
const { status, propagation } = await client.verifyScope(scope.token);
if (status === 'revoked') throw new Error('Agent is revoked');
if (status === 'revocation_propagating') {
  console.warn(`Revocation window: ${propagation!.windowRemainingMs}ms remaining`);
}

// Revoke immediately (e.g. on user logout or anomaly detection)
await client.revokeScope(scope.token);
```

---

## Step-by-step negotiation

For cases where you need per-round control:

```typescript
const { sessionId } = await client.startNegotiation({
  scopeToken: scope.token,
  listingId: 'listing_xyz',
  idempotencyKey: 'my-unique-key',  // optional — prevents duplicate sessions
});

// Submit offers round by round
const round1 = await client.submitOffer(sessionId, 420_00);  // $420.00
console.log(`Seller counter: $${round1.counterOffer! / 100}`);

// Finalize when done
const result = await client.finalize(sessionId);
```

---

## Idempotency

All mutation methods accept an optional `idempotencyKey`. Replay the same key within 24 hours and the server returns the original result without creating a duplicate session.

```typescript
import { generateIdempotencyKey } from '@klave/sdk';

const key = generateIdempotencyKey();
const result1 = await client.negotiate({ scopeToken, listingId, idempotencyKey: key });
const result2 = await client.negotiate({ scopeToken, listingId, idempotencyKey: key });
// result1 === result2 — no duplicate session
```

---

## Express middleware example

```typescript
import express from 'express';
import { KlaveClient } from '@klave/sdk';

const client = new KlaveClient({ apiKey: process.env.KLAVE_KEY! });
const app = express();

app.post('/negotiate', async (req, res) => {
  const { scopeToken, listingId } = req.body;
  try {
    const { status } = await client.verifyScope(scopeToken);
    if (status !== 'active') return res.status(403).json({ error: 'Scope not active' });

    const result = await client.negotiate({ scopeToken, listingId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
```

---

## Error handling

```typescript
import { KlaveError } from '@klave/sdk';

try {
  await client.negotiate({ scopeToken, listingId });
} catch (err) {
  if (err instanceof KlaveError) {
    console.log(err.code);       // e.g. 'CEILING_EXCEEDED', 'SCOPE_REVOKED'
    console.log(err.retryable);  // true for RATE_LIMITED, SERVICE_DEGRADED, NETWORK_ERROR
  }
}
```

**Error codes:** `IDENTITY_INVALID` · `EXPIRED_SCOPE` · `CEILING_EXCEEDED` · `CATEGORY_DENIED` · `BUDGET_EXCEEDED` · `SCOPE_REVOKED` · `REVOCATION_PROPAGATING` · `SESSION_NOT_FOUND` · `NEGOTIATION_FAILED` · `NEGOTIATION_TIMEOUT` · `IDEMPOTENCY_CONFLICT` · `CIRCUIT_VERSION_MISMATCH` · `RATE_LIMITED` · `SERVICE_DEGRADED` · `NETWORK_ERROR`

---

## Telemetry hook

```typescript
const client = new KlaveClient({
  apiKey: process.env.KLAVE_KEY!,
  telemetryHook: {
    onEvent(event) {
      if (event.type === 'negotiation_settled') {
        metrics.record('klave.settled', event.durationMs);
      }
    },
  },
});
```

---

## Open source vs KLAVE API

| Layer | Status |
|---|---|
| Type definitions, error model, idempotency, telemetry hook | Open source (this repo) |
| `KlaveClient` HTTP calls | Open source — targets `https://api.klave.com` |
| KLAVE negotiation engine (concession math, ZK proofs, floor price enforcement) | KLAVE API — requires API key |

The SDK itself has zero runtime dependencies. The negotiation logic runs server-side.

---

## Python SDK

A Python client is in [`python/klave_sdk/`](python/klave_sdk/). Install:

```bash
pip install klave-sdk  # coming soon — use the source directly for now
```

---

## Links

- [KLAVE MCP server](https://github.com/juny-klave/klave-mcp) — use KLAVE from Claude without writing code
- [API docs](https://klavecommerce.com/docs)
- [npm: @klave/sdk](https://npmjs.com/package/@klave/sdk)

---

## License

MIT
