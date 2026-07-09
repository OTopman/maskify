import { AutoMaskOptions, Detectors, MaskableType, MaskOptions } from '../../utils';
import { getCachedRegex } from '../../utils/cache';
import { deepVisit, deepVisitAsync } from './traverser';

export type AutoMaskingCallback = (value: string, options: MaskOptions) => string;

export type AutoMaskingCallbackAsync = (value: string, options: MaskOptions) => Promise<string> | string;

const DEFAULT_SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'auth',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'cvv',
  'cvc',
  'pin',
  'otp',
  'ssn',
  'social_security',
  'credit_card',
];

const DEFAULT_DETECT_TYPES: MaskableType[] = [
  'email',
  'phone',
  'card',
  'ip',
  'jwt',
];

/**
 * Builds a whole-word-ish key matcher so "author" doesn't trigger on "auth"
 * and "secretary" doesn't trigger on "secret". Separators between words
 * may be underscore, hyphen, dot, or camelCase boundaries.
 */
function buildKeyMatcher(keysList: string[]): (key: string) => boolean {
  const cacheKey = `keys:${keysList.join(',')}`;
  const keyRegex = getCachedRegex(cacheKey, () => {
    const escaped = keysList.map((k) =>
      k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    const boundary = '(?:^|[^a-zA-Z0-9])';
    const tail = '(?:$|[^a-zA-Z0-9])';
    return new RegExp(
      `${boundary}(?:${escaped.join('|')})${tail}`,
      'i',
    );
  });

  return (key: string) => {
    // Split camelCase/PascalCase so "apiKey" resolves via word-boundary match.
    const normalized = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
    return keyRegex.test(normalized);
  };
}

export function applyAutoStrategy(
  target: any,
  options: AutoMaskOptions,
  maskFn: AutoMaskingCallback,
): void {
  const keysList = options.sensitiveKeys || DEFAULT_SENSITIVE_KEYS;
  const detectTypes = new Set(options.autoDetectTypes || DEFAULT_DETECT_TYPES);
  const matchesKey = buildKeyMatcher(keysList);

  deepVisit(target, (key, val, parent) => {
    if (
      matchesKey(key) &&
      ['string', 'number', 'boolean'].includes(typeof val)
    ) {
      parent[key] = maskFn(String(val), { ...options, type: 'generic' });
      return;
    }

    if (typeof val === 'string') {
      const type = Detectors.detectType(val);
      if (detectTypes.has(type)) {
        parent[key] = maskFn(val, { ...options, type });
      }
    }
  });
}

/**
 * Auto-detect and mask sensitive keys/types asynchronously.
 */
export async function applyAutoStrategyAsync(
  target: any,
  options: AutoMaskOptions,
  maskFn: AutoMaskingCallbackAsync,
): Promise<void> {
  const keysList = options.sensitiveKeys || DEFAULT_SENSITIVE_KEYS;
  const detectTypes = new Set(options.autoDetectTypes || DEFAULT_DETECT_TYPES);
  const matchesKey = buildKeyMatcher(keysList);

  await deepVisitAsync(target, async (key, val, parent) => {
    if (
      matchesKey(key) &&
      ['string', 'number', 'boolean'].includes(typeof val)
    ) {
      parent[key] = await maskFn(String(val), { ...options, type: 'generic' });
      return;
    }

    if (typeof val === 'string') {
      const type = Detectors.detectType(val);
      if (detectTypes.has(type)) {
        parent[key] = await maskFn(val, { ...options, type });
      }
    }
  });
}
