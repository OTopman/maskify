import { PATTERNS } from '../core/patterns/definitions';
import type { MaskableType } from './types';

/**
 * Luhn mod-10 checksum used by issued PAN formats. Rejects numeric strings
 * of plausible card length that aren't valid card numbers, cutting the
 * false-positive rate of the regex-only heuristic substantially.
 */
export function passesLuhn(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    const code = digits.charCodeAt(i);
    if (code < 48 || code > 57) return false;
    let n = code - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export const Detectors = {
  isEmail: (v: string): boolean => PATTERNS.EMAIL.test(v),

  isPhone: (v: string): boolean => PATTERNS.PHONE.test(v),

  isCard: (v: string): boolean => {
    if (!PATTERNS.CARD.test(v)) return false;
    return passesLuhn(v.replace(/[\s-]/g, ''));
  },

  isAddress: (v: string): boolean =>
    PATTERNS.ADDRESS_START.test(v) && PATTERNS.ADDRESS_SUFFIX.test(v),

  isName: (v: string): boolean => {
    const trimmed = v.trim();
    return PATTERNS.NAME_CHARS.test(trimmed) && /\s/.test(trimmed);
  },

  isIp: (v: string): boolean => PATTERNS.IPV4.test(v) || PATTERNS.IPV6.test(v),

  isJwt: (v: string): boolean => PATTERNS.JWT.test(v),

  isUrl: (v: string): boolean => PATTERNS.URL.test(v),

  isSensitiveKey: (key: string): boolean => PATTERNS.SENSITIVE_KEYS.test(key),

  /**
   * Detect the type of a string value using pre-compiled patterns.
   * Order matters: more specific patterns first so cards don't lose to phone.
   */
  detectType(value: string): MaskableType {
    const trimmed = value.trim();
    if (!trimmed) return 'generic';

    if (Detectors.isJwt(trimmed)) return 'jwt';
    if (Detectors.isEmail(trimmed)) return 'email';
    if (Detectors.isIp(trimmed)) return 'ip';
    if (Detectors.isCard(trimmed)) return 'card';
    if (Detectors.isPhone(trimmed)) return 'phone';
    if (Detectors.isUrl(trimmed)) return 'url';
    if (Detectors.isAddress(trimmed)) return 'address';
    if (Detectors.isName(trimmed)) return 'name';

    return 'generic';
  },
};
