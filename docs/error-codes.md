# KLAVE SDK Error Codes

| Code | Cause | Integrator response |
|---|---|---|
| IDENTITY_INVALID | Pre-session identity mismatch | Reject request and re-issue proper scope |
| EXPIRED_SCOPE | Scope token expired beyond skew tolerance | Create a fresh scope token |
| CEILING_EXCEEDED | Requested transaction above maxTransactionCents | Lower amount or issue broader scope |
| CATEGORY_DENIED | Listing category not explicitly permitted | Request a scope with correct category |
| BUDGET_EXCEEDED | Rolling 7-day budget CAS check rejected | Wait for window to roll or increase budget |
| SCOPE_REVOKED | Token was revoked | Stop using token immediately |
| REVOCATION_PROPAGATING | Revocation in async propagation window | Treat as revoked and fail closed |
| SESSION_EXPIRED | Session hard TTL reached | Start a new negotiation session |
| SESSION_NOT_FOUND | Session id does not exist | Verify session id and restart if needed |
| SESSION_HANDOFF_NOT_SUPPORTED | v1 handoff attempted across agent instances | Keep session bound to original instance |
| NEGOTIATION_FAILED | Negotiation failed safely | Inspect reason and retry manually if appropriate |
| NEGOTIATION_TIMEOUT | Long-poll timed out | Retry negotiate with idempotency key |
| EMPTY_CATEGORIES | Scope issued with no categories | Provide at least one permitted category |
| CATEGORIES_LIMIT_EXCEEDED | More than 20 categories or over 64 chars each | Reduce categories to policy limits |
| BUDGET_CEILING_INCONSISTENT | weeklyBudgetCents < maxTransactionCents | Fix issuance parameters and retry |
| DELEGATION_NOT_SUPPORTED | delegationDepth > 0 in v1 | Use delegationDepth=0 only |
| IDEMPOTENCY_CONFLICT | Same key reused with different params | Generate a new key and retry once |
| CIRCUIT_VERSION_MISMATCH | verifyProof called with missing/mismatched circuit version | Pin to published manifest and retry |
| RATE_LIMITED | API rate-limited | Respect Retry-After and retry |
| SERVICE_DEGRADED | KLAVE service unavailable/degraded | Fail closed and retry with backoff |
| NETWORK_ERROR | Request timed out or network error | Safe retry with same idempotency key |
