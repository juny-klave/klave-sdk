# API

All endpoints are versioned and mapped to `/v1/*` server routes.

- `createAgentScope` → `POST /v1/agent-scope/create`
- `verifyScope` → `POST /v1/agent-scope/verify`
- `revokeScope` → `POST /v1/agent-scope/revoke`
- `startNegotiation` → `POST /v1/negotiation/start`
- `submitOffer` → `POST /v1/negotiation/offer`
- `finalize` → `POST /v1/negotiation/finalize`
- `negotiate` → `POST /v1/negotiation/auto`
- `getProof` → `GET /v1/negotiation/:id/proof`
- `verifyProof` → `POST /v1/verify`
