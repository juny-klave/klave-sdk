import { KlaveClient } from '../src/client';
import { buildClient, jsonResponse } from './helpers';

describe('circuit version pinning', () => {
  it('throws hard error on missing circuitVersion', async () => {
    const client = new KlaveClient({ apiKey: 'key', fetchImpl: async () => jsonResponse({ ok: true, status: 200, body: {} }) });
    await expect(client.verifyProof({ proof: 'p', publicInputs: {}, circuitVersion: '' })).rejects.toMatchObject({ code: 'CIRCUIT_VERSION_MISMATCH' });
  });

  it('accepts explicit circuitVersion', async () => {
    const client = buildClient(async () => jsonResponse({ ok: true, status: 200, body: { valid: true, policyCompliant: true, auditHash: 'h', circuitVersion: 'v1' } }));
    await expect(client.verifyProof({ proof: 'p', publicInputs: {}, circuitVersion: 'v1' })).resolves.toMatchObject({ valid: true, circuitVersion: 'v1' });
  });
});
