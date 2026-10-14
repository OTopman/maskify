import { createDualModeMasker, MaskContext } from '../core/masker';

export interface SecretOptions {
  /** Unmasked characters at start (if keepPrefix is true and recognized, prefix is preserved; otherwise default: 4) */
  visibleStart?: number;
  /** Unmasked characters at end (default: 0) */
  visibleEnd?: number;
  /** Mask character (default: '*') */
  maskChar?: string;
  /** Retain recognized API key prefixes (e.g. AKIA, ghp_, sk_live_) to maintain token identify (default: true) */
  keepPrefix?: boolean;
}

const KNOWN_KEY_PREFIXES = [
  'AKIA',
  'ASIA',
  'AROA',
  'ghp_',
  'gho_',
  'ghu_',
  'ghs_',
  'ghr_',
  'github_pat_',
  'sk_live_',
  'sk_test_',
  'pk_live_',
  'pk_test_',
  'rk_live_',
  'rk_test_',
  'xoxb-',
  'xoxp-',
  'xoxa-',
  'xoxr-',
  'Bearer ',
];

function runSecretMasking(secret: string, opts: SecretOptions, _ctx: MaskContext): string {
  const { visibleStart, visibleEnd = 0, maskChar = '*', keepPrefix = true } = opts;
  if (!secret) return '';

  if (secret.startsWith('-----BEGIN') && secret.includes('PRIVATE KEY')) {
    return '[REDACTED_PRIVATE_KEY]';
  }

  let prefix = '';
  let rest = secret;

  if (keepPrefix) {
    for (const p of KNOWN_KEY_PREFIXES) {
      if (secret.startsWith(p)) {
        prefix = p;
        rest = secret.slice(p.length);
        break;
      }
    }
  }

  const startLen = visibleStart !== undefined ? visibleStart : (prefix ? 0 : 4);
  const endLen = visibleEnd;

  if (rest.length <= startLen + endLen) {
    return prefix + maskChar.repeat(rest.length);
  }

  const unmaskedStart = rest.slice(0, startLen);
  const unmaskedEnd = endLen > 0 ? rest.slice(rest.length - endLen) : '';
  const maskedLen = rest.length - startLen - endLen;

  return prefix + unmaskedStart + maskChar.repeat(maskedLen) + unmaskedEnd;
}

export const maskSecret = createDualModeMasker(runSecretMasking);
