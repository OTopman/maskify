import { MaskOptions } from '../utils';

/**
 * Mask a phone number.
 * - Preserves "+" only if visibleStart > 0
 * - Otherwise, masks it along with digits.
 *
 * Examples:
 *   "+2348123456789" (visibleStart=2, visibleEnd=3) → "+81****6789"
 *   "+2348123456789" (visibleStart=0) → "*******6789"
 */
export function maskPhone(
  phone: string,
  options: Pick<
    MaskOptions,
    'maxAsterisks' | 'maskChar' | 'visibleStart' | 'visibleEnd'
  > = {}
): string {
  const {
    maxAsterisks = 4,
    maskChar = '*',
    visibleStart = 2,
    visibleEnd = 3,
  } = options;

  if (!phone) return '';

  const hasPlus = phone.startsWith('+');
  const digitsOnly = phone.replace(/\D/g, '');

  if (!digitsOnly.length) return phone;

  const pureValue =
    hasPlus && visibleStart > 0
      ? digitsOnly
      : phone.replace('+', '').replace(/\D/g, '');

  const len = pureValue.length;

  // Handle short numbers safely
  if (len <= visibleStart + visibleEnd) {
    const start = pureValue.slice(0, 1);
    const masked = maskChar.repeat(Math.min(maxAsterisks, len - 1));
    return `${visibleStart > 0 && hasPlus ? '+' : ''}${start}${masked}`;
  }

  const start = pureValue.slice(0, visibleStart);
  const end = pureValue.slice(-visibleEnd);
  const maskCount = Math.min(
    maxAsterisks,
    Math.max(len - visibleStart - visibleEnd, 3)
  );

  const maskedMiddle = maskChar.repeat(maskCount);

  // Only prepend "+" if visibleStart > 0
  return `${
    visibleStart > 0 && hasPlus ? '+' : ''
  }${start}${maskedMiddle}${end}`;
}
