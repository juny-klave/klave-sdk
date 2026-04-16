import type { TelemetryEvent } from '../src/types';
import { KlaveClient } from '../src/client';
import { jsonResponse } from './helpers';

describe('anomaly telemetry', () => {
  it('allows operators to collect anomaly signals without exposing prices', async () => {
    const events: TelemetryEvent[] = [];
    const client = new KlaveClient({
      apiKey: 'key',
      baseUrl: 'https://example.test',
      fetchImpl: async () => jsonResponse({ ok: true, status: 200, body: { status: 'settled', sessionId: 's1' } }),
      telemetryHook: { onEvent: (event) => events.push(event) },
    });

    await client.negotiate({ scopeToken: 'tok', listingId: 'list_1' });
    events.push({ type: 'anomaly_signal', sessionId: 's1', signal: 'near_grinding' });

    expect(events.find((event) => event.type === 'anomaly_signal')).toBeDefined();
  });
});
