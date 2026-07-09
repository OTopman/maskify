import { createDualModeMasker, MaskContext } from '../core/masker';

export interface PhoneOptions {
  maxAsterisks?: number;
  maskChar?: string;
  visibleStart?: number;
  visibleEnd?: number;
  visiblePrefixDigits?: number;
  visibleSuffixDigits?: number;
}

function runPhoneMasking(phone: string, opts: PhoneOptions, _ctx: MaskContext): string {
  const visibleStart = opts.visibleStart ?? opts.visiblePrefixDigits ?? 2;
  const visibleEnd = opts.visibleEnd ?? opts.visibleSuffixDigits ?? 3;
  const {
    maxAsterisks = 4,
    maskChar = '*',
  } = opts;

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

export const maskPhone = createDualModeMasker(runPhoneMasking, { coerce: true });
