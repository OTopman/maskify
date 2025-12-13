import { RegexLib } from '../core/patterns/definitions';
import { MaskableType } from './types';

/**
 * Utility class to detect data types based on string patterns.
 */

export const Detectors = {
  isEmail: (v: string) => new RegExp(`^${RegexLib.EMAIL.source}$`).test(v),
  isPhone: (v: string) => new RegExp(`^${RegexLib.PHONE.source}$`).test(v),
  isCard: (v: string) => new RegExp(`^${RegexLib.CARD.source}$`).test(v),
  /**
   * Detects if a string is likely an address.
   * Requires:
   * 1. Starting with digits (street number)
   * 2. Containing a known street suffix (Street, Rd, Ave, etc.)
   */
  isAddress: (v: string) =>
    new RegExp(RegexLib.ADDRESS_START).test(v) &&
    new RegExp(RegexLib.ADDRESS_SUFFIX).test(v),

  /**
   * Detects if a string is likely a name.
   * Requires:
   * 1. Only valid name characters (letters, dots, dashes, apostrophes)
   * 2. At least one space (to distinguish "John Doe" from just "John" or "Hello")
   */
  isName: (v: string) =>
    new RegExp(RegexLib.NAME_CHARS).test(v.trim()) && /\s/.test(v.trim()),
  isIp: (v: string) =>
    new RegExp(`^${RegexLib.IPV4.source}$`).test(v) ||
    new RegExp(`^${RegexLib.IPV6.source}$`).test(v),
  isJwt: (v: string) => new RegExp(`^${RegexLib.JWT.source}$`).test(v),
  isUrl: (v: string) => new RegExp(`^${RegexLib.URL.source}$`).test(v),

  detectType(value: string): MaskableType {
    const trimmed = value.trim();
    if (this.isEmail(trimmed)) return 'email';
    if (this.isPhone(trimmed)) return 'phone';
    if (this.isCard(trimmed)) return 'card';
    if (this.isIp(trimmed)) return 'ip';
    if (this.isJwt(trimmed)) return 'jwt';
    if (this.isUrl(trimmed)) return 'url';
    if (this.isAddress(trimmed)) return 'address';
    if (this.isName(trimmed)) return 'name';
    return 'generic';
  },
};
