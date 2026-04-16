# Telemetry

Telemetry is opt-in through `telemetryHook` and defaults to no-op.

The SDK emits only metadata events (no offer values, prices, floor/ceiling values, or private model params).

Supported events are defined by `TelemetryEvent` in `src/types.ts`.
