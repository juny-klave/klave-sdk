# Degraded Mode Contract

KLAVE SDK operates in **fail-closed** mode for authorization and budget enforcement paths.

| Condition | SDK behavior |
|---|---|
| KLAVE unreachable | Return `SERVICE_DEGRADED` |
| Budget service degraded | Return `SERVICE_DEGRADED`, do not proceed |
| Revocation verification unavailable | Return `SERVICE_DEGRADED`, treat as revoked |
| Reaper backlog | Session still expires at hard TTL server-side |
| ZK prover unavailable | Settlement can return `proofPending: true`; fetch later via `getProof` |
| Audit commitment write failure | Server blocks settlement; SDK surfaces error |
