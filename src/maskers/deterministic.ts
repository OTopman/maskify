import { createHmac } from 'node:crypto';
import { MaskifyConfigError } from '../utils/errors';
import type { MaskOptions } from '../utils/types';

export interface DeterministicOptions extends MaskOptions {
  /**
   * REQUIRED: Secret key for HMAC hashing.
   * MUST be stored in environment variable, NEVER committed to version control.
   * Example: process.env.MASKIFY_SECRET
   */
  secret: string;
  algorithm?: 'sha256' | 'sha512';
  length?: number; // Default: 12 chars of hex output
}

/**
 * Generates a consistent, non-reversible hash for analytics/tracking.
 *
 * This function REQUIRES a secret. No default/fallback allowed.
 *
 * @param value - The string to hash (e.g., email, user ID)
 * @param opts - Options including REQUIRED secret
 * @returns Hex string of specified length
 *
 * @example
 * ```ts
 * const hash = Maskify.deterministic('user@example.com', {
 *   secret: process.env.MASKIFY_SECRET!, // REQUIRED
 *   length: 16
 * });
 * // → "a3f12b9c8e7d4f21" (consistent for same input+secret)
 * ```
 */
export function maskDeterministic(
  value: string,
  opts: DeterministicOptions,
): string {
  // Reject if no secret provided
  if (!opts.secret || opts.secret.length < 16) {
    throw new MaskifyConfigError(
      'maskDeterministic requires a "secret" of at least 16 characters',
      'Store your secret in an environment variable: process.env.MASKIFY_SECRET',
    );
  }

  const { secret, algorithm = 'sha256', length = 12 } = opts;

  // Input validation
  if (typeof value !== 'string') {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }

  // Prevent ReDoS / memory exhaustion
  const MAX_INPUT_LENGTH = 1024;
  if (value.length > MAX_INPUT_LENGTH) {
    throw new RangeError(
      `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
    );
  }

  return createHmac(algorithm, secret)
    .update(value, 'utf8')
    .digest('hex')
    .substring(0, length);
}
