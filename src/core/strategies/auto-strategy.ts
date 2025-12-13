import { MaskifyCore } from '../maskify';
import { Detectors, MaskableType, MaskOptions } from '../../utils';
import { getCachedRegex } from '../../utils/cache';
import { deepVisit } from './traverser';

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

  // Compile Regex (Optimized)
  const cacheKey = `keys:${keysList.join(',')}`;
  const keyRegex = getCachedRegex(cacheKey, () => {
    const escaped = keysList.map((k) =>
      k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    return new RegExp(escaped.join('|'), 'i');
  });

  // Use the Visitor Pattern
  deepVisit(target, (key, val, parent) => {
    // 1. Key Matching Strategy
    if (
      keyRegex.test(key) &&
      ['string', 'number', 'boolean'].includes(typeof val)
    ) {
      parent[key] = MaskifyCore.mask(String(val), {
        ...options,
        type: 'generic',
      });
      return;
    }

    // 2. Value Analysis Strategy
    if (typeof val === 'string') {
      const type = Detectors.detectType(val);
      if (detectTypes.has(type)) {
        parent[key] = MaskifyCore.mask(val, { ...options, type });
      }
    }
  });
}
