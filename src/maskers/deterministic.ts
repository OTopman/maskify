import { MaskifyConfigError } from '../utils/errors';
import type { MaskOptions } from '../utils/types';

// Safe Node.js crypto loader to avoid bundler errors in browser/edge environments
let nodeCrypto: any = null;
try {
  const req = typeof module !== 'undefined' && typeof require === 'function' ? require : undefined;
  nodeCrypto = req ? req('crypto') : undefined;
} catch {
  // Ignore
}

export interface DeterministicOptions extends MaskOptions {
  /**
   * REQUIRED: Secret key for HMAC hashing.
   * MUST be stored in environment variable, NEVER committed to version control.
   */
  secret: string;
  algorithm?: 'sha256' | 'sha512';
  length?: number; // Default: 12 chars of hex output
}

/**
 * Helper using standard Web Crypto API for HMAC hashing
 */
async function webCryptoHmac(
  algorithm: 'sha256' | 'sha512',
  secret: string,
  value: string
): Promise<string> {
  const cryptoObj = typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : undefined;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not supported in this environment.');
  }

  const enc = new globalThis.TextEncoder();
  const keyData = enc.encode(secret);
  const data = enc.encode(value);

  const hashName = algorithm === 'sha512' ? 'SHA-512' : 'SHA-256';

  const key = await cryptoObj.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: hashName },
    false,
    ['sign']
  );

  const signature = await cryptoObj.subtle.sign('HMAC', key, data);
  
  // Convert signature to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generates a consistent, non-reversible hash for analytics/tracking (Synchronous).
 * Only supported in Node.js.
 */
export function maskDeterministic(
  value: string,
  opts: DeterministicOptions = {} as any,
): string {
  if (!opts || !opts.secret || opts.secret.length < 16) {
    throw new MaskifyConfigError(
      'maskDeterministic requires a "secret" of at least 16 characters',
      'Store your secret in an environment variable: process.env.MASKIFY_SECRET',
    );
  }

  const { secret, algorithm = 'sha256', length = 12 } = opts;

  if (typeof value !== 'string') {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }

  const MAX_INPUT_LENGTH = 1024;
  if (value.length > MAX_INPUT_LENGTH) {
    throw new RangeError(
      `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
    );
  }

  if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
    return nodeCrypto
      .createHmac(algorithm, secret)
      .update(value, 'utf8')
      .digest('hex')
      .substring(0, length);
  }

  throw new MaskifyConfigError(
    'Synchronous deterministic masking is only supported in Node.js environments. For browser or edge runtimes, please use the async API: Maskify.deterministicAsync(...)',
    'Switch to the asynchronous API.'
  );
}

/**
 * Generates a consistent, non-reversible hash for analytics/tracking (Asynchronous).
 * Supported in both Node.js and Browser environments.
 */
export async function maskDeterministicAsync(
  value: string,
  opts: DeterministicOptions = {} as any,
): Promise<string> {
  if (!opts || !opts.secret || opts.secret.length < 16) {
    throw new MaskifyConfigError(
      'maskDeterministicAsync requires a "secret" of at least 16 characters',
      'Store your secret in an environment variable: process.env.MASKIFY_SECRET',
    );
  }

  const { secret, algorithm = 'sha256', length = 12 } = opts;

  if (typeof value !== 'string') {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }

  const MAX_INPUT_LENGTH = 1024;
  if (value.length > MAX_INPUT_LENGTH) {
    throw new RangeError(
      `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
    );
  }

  // Use Web Crypto which is globally available in modern environments
  try {
    const hex = await webCryptoHmac(algorithm, secret, value);
    return hex.substring(0, length);
  } catch (e: any) {
    // Fall back to Node crypto if Web Crypto is somehow not active (e.g. older Node)
    if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
      return nodeCrypto
        .createHmac(algorithm, secret)
        .update(value, 'utf8')
        .digest('hex')
        .substring(0, length);
    }
    throw e;
  }
}
