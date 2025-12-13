import { MaskOptions } from '../utils';
import { DEFAULT_MASK_OPTIONS } from '../utils/defaults';

/**
 * Masks an email address while preserving its recognisable structure.
 *
 * Example:
 *   "temitope.okunlola@gmail.com" → "temi****@g***.com"
 *   "a@b.com" → "*@b.com"
 *
 * @param email - The email address to mask.
 * @param options - Masking options.
 */
export function maskEmail(
  email: string,
  options: Pick<
    MaskOptions,
    'maxAsterisks' | 'maskChar' | 'visibleStart' | 'visibleEnd'
  > = {}
): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return email || '';
  }

  const config = {
    ...DEFAULT_MASK_OPTIONS,
    ...options,
  };

  const {
    maxAsterisks = 4,
    visibleStart = 0,
    visibleEnd = 0,
    maskChar = '*',
  } = config;

  const [localPart, domainPart] = email.split('@');
  if (!localPart || !domainPart) return email;

  const [domainName, ...rest] = domainPart.split('.');
  const domainExt = rest.join('.') || '';

  // --- Mask local part ---
  const safeVisibleStart = Math.min(visibleStart, localPart.length - 1);
  const maskedLocalCount = Math.min(
    maxAsterisks,
    Math.max(localPart.length - safeVisibleStart, 3)
  );

  const start = localPart.slice(0, safeVisibleStart);
  const maskedLocal = `${start}${maskChar.repeat(maskedLocalCount)}`;

  // --- Mask domain name ---
  const safeVisibleEnd = Math.min(visibleEnd, domainName.length - 1);
  const maskedDomainCount = Math.min(
    3,
    Math.max(domainName.length - safeVisibleEnd, 1)
  );

  const domainVisibleStart = domainName.slice(0, safeVisibleEnd);
  const maskedDomain = `${domainVisibleStart}${maskChar.repeat(
    maskedDomainCount
  )}`;

  // --- Combine ---
  return `${maskedLocal}@${maskedDomain}${domainExt ? `.${domainExt}` : ''}`;
}
