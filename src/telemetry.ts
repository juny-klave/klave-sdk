import type { TelemetryEvent, TelemetryHook } from './types';

export const NoopTelemetryHook: TelemetryHook = {
  onEvent(_event: TelemetryEvent): void {
    // intentionally no-op
  },
};

export function emitTelemetry(hook: TelemetryHook | undefined, event: TelemetryEvent): void {
  (hook ?? NoopTelemetryHook).onEvent(event);
}
