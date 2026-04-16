import { webcrypto } from 'node:crypto';
import { KlaveError, type KlaveErrorCode } from './errors';
import type { RetryPolicy } from './types';

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoffMs: 250,
  retryOn: ['RATE_LIMITED', 'SERVICE_DEGRADED', 'NETWORK_ERROR'],
};

export const SAFE_RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;

export function generateIdempotencyKey(date: Date = new Date()): string {
  const timestamp = BigInt(date.getTime()) & BigInt('0xffffffffffff');
  const rand = webcrypto.getRandomValues(new Uint8Array(10));
  const bytes = new Uint8Array(16);

  bytes[0] = Number((timestamp >> BigInt(40)) & BigInt(0xff));
  bytes[1] = Number((timestamp >> BigInt(32)) & BigInt(0xff));
  bytes[2] = Number((timestamp >> BigInt(24)) & BigInt(0xff));
  bytes[3] = Number((timestamp >> BigInt(16)) & BigInt(0xff));
  bytes[4] = Number((timestamp >> BigInt(8)) & BigInt(0xff));
  bytes[5] = Number(timestamp & BigInt(0xff));

  bytes[6] = 0x70 | (rand[0] & 0x0f);
  bytes[7] = rand[1];
  bytes[8] = 0x80 | (rand[2] & 0x3f);
  bytes.set(rand.slice(3), 9);

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): Promise<T> {
  let attempt = 0;
  while (attempt < policy.maxAttempts) {
    try {
      return await operation(attempt);
    } catch (error) {
      const nextAttempt = attempt + 1;
      const code = error instanceof KlaveError ? error.code : 'NETWORK_ERROR';
      const retryable = error instanceof KlaveError ? error.retryable : true;
      if (!retryable || !policy.retryOn.includes(code as KlaveErrorCode) || nextAttempt >= policy.maxAttempts) {
        throw error;
      }
      const waitMs = policy.backoffMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt = nextAttempt;
    }
  }
  throw new KlaveError('Retry attempts exhausted', 'SERVICE_DEGRADED', undefined, true);
}
