import { AutoMaskOptions, Detectors, MaskableType } from '../../utils';
import { getCachedRegex } from '../../utils/cache';
import { MaskifyCore } from '../maskify';
import { deepVisit } from './traverser';

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

export function applyAutoStrategy(
  target: any,
  options: AutoMaskOptions = {}
): void {
  const keysList = options.sensitiveKeys || DEFAULT_SENSITIVE_KEYS;
  const detectTypes = new Set(options.autoDetectTypes || DEFAULT_DETECT_TYPES);

  // Build a whole-word-ish matcher so "author" doesn't trigger on "auth"
  // and "secretary" doesn't trigger on "secret". Separators between words
  // may be underscore, hyphen, dot, or camelCase boundaries.
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

  const matchesKey = (key: string) => {
    // Split camelCase/PascalCase so "apiKey" resolves via word-boundary match.
    const normalized = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
    return keyRegex.test(normalized);
  };

  deepVisit(target, (key, val, parent) => {
    if (
      matchesKey(key) &&
      ['string', 'number', 'boolean'].includes(typeof val)
    ) {
      parent[key] = MaskifyCore.mask(String(val), {
        ...options,
        type: 'generic',
      });
      return;
    }

    if (typeof val === 'string') {
      const type = Detectors.detectType(val);
      if (detectTypes.has(type)) {
        parent[key] = MaskifyCore.mask(val, { ...options, type });
      }
    }
  });
}
