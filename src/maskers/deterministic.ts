import { createDualModeMasker, MaskContext } from '../core/masker';
import { MaskifyConfigError } from '../utils/errors';

// Safe Node.js crypto loader to avoid bundler errors in browser/edge environments
let nodeCrypto: any = null;
try {
  const req = typeof module !== 'undefined' && typeof require === 'function' ? require : undefined;
  nodeCrypto = req ? req('crypto') : undefined;
} catch {
  // Ignore
}

export interface DeterministicOptions {
  secret: string;
  algorithm?: 'sha256' | 'sha512';
  length?: number; // Default: 12 chars of hex output
}

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

  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function runDeterministicSync(value: string, opts: DeterministicOptions, _ctx: MaskContext): string {
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

async function runDeterministicAsync(value: string, opts: DeterministicOptions, _ctx: MaskContext): Promise<string> {
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

  try {
    const hex = await webCryptoHmac(algorithm, secret, value);
    return hex.substring(0, length);
  } catch (e: any) {
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

export const maskDeterministic = createDualModeMasker(runDeterministicSync);
export const maskDeterministicAsync = createDualModeMasker<DeterministicOptions, Promise<string>>(
  runDeterministicAsync,
);
