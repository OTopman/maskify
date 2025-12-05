import { MaskifyCore } from '../maskify';
import { Detectors, MaskableType, MaskOptions } from '../../utils';
import { getCachedRegex } from '../../utils/cache';

export interface AutoMaskOptions extends MaskOptions {
  sensitiveKeys?: string[];
  autoDetectTypes?: MaskableType[];
}

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

  // ⚡️ Performance: Compile sensitive keys into a single Regex
  const cacheKey = `keys:${keysList.join(',')}`;
  const keyRegex = getCachedRegex(cacheKey, () => {
    // Escape special regex chars just in case
    const escaped = keysList.map((k) =>
      k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    return new RegExp(escaped.join('|'), 'i');
  });

  const traverse = (current: any) => {
    if (!current || typeof current !== 'object') return;

    for (const key in current) {
      // eslint-disable-next-line no-prototype-builtins
      if (!Object.prototype.hasOwnProperty.call(current, key)) continue;

      const val = current[key];

      // 1. Check Key Name using optimized Regex (O(1) vs O(N))
      if (keyRegex.test(key)) {
        if (['string', 'number', 'boolean'].includes(typeof val)) {
          current[key] = MaskifyCore.mask(String(val), {
            ...options,
            type: 'generic',
          });
          continue;
        }
      }

      // 2. Check Value Content
      if (typeof val === 'string') {
        const type = Detectors.detectType(val);
        if (detectTypes.has(type)) {
          current[key] = MaskifyCore.mask(val, { ...options, type });
        }
      }

      // 3. Recurse
      if (typeof val === 'object' && val !== null) {
        traverse(val);
      }
    }
  };

  traverse(target);
}
