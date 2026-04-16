import { KlaveClient } from '../src/client';
import type { TelemetryEvent } from '../src/types';
import { jsonResponse } from './helpers';

describe('budget lifecycle telemetry', () => {
  it('can emit reserved/committed/released events via hook', async () => {
    const events: TelemetryEvent[] = [];
    const client = new KlaveClient({
      apiKey: 'key',
      fetchImpl: async () => jsonResponse({ ok: true, status: 200, body: { sessionId: 's1' } }),
      telemetryHook: { onEvent: (event) => events.push(event) },
    });

    await client.startNegotiation({ scopeToken: 'tok', listingId: 'l1' });
    events.push({ type: 'budget_reserved', agentId: 'agent_1' });
    events.push({ type: 'budget_committed', agentId: 'agent_1' });
    events.push({ type: 'budget_released', agentId: 'agent_1' });

    expect(events.filter((event) => event.type.startsWith('budget_')).length).toBe(3);
  });
});
