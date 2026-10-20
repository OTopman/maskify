import { createDualModeMasker, MaskContext } from '../core/masker';

export interface SsnOptions {
  /** Number of unmasked digits at the end (default: 4, preserving last 4 digits per standard US compliance) */
  visibleEnd?: number;
  /** Mask character (default: '*') */
  maskChar?: string;
  /** Preserve spacing/dash formatting of original input (default: true) */
  preserveFormat?: boolean;
}

/**
 * Validates a US Social Security Number according to Social Security Administration (SSA) rules:
 * - 9 digits total.
 * - Area number (first 3 digits): cannot be 000, 666, or in 900-999.
 * - Group number (middle 2 digits): cannot be 00.
 * - Serial number (last 4 digits): cannot be 0000.
 */
export function isValidSsn(ssn: string): boolean {
  if (!ssn || typeof ssn !== 'string') return false;
  const digitsOnly = ssn.replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(digitsOnly)) return false;

  const area = parseInt(digitsOnly.slice(0, 3), 10);
  const group = parseInt(digitsOnly.slice(3, 5), 10);
  const serial = parseInt(digitsOnly.slice(5, 9), 10);

  if (area === 0 || area === 666 || area >= 900) return false;
  if (group === 0) return false;
  if (serial === 0) return false;

  return true;
}

function runSsnMasking(ssn: string, opts: SsnOptions, _ctx: MaskContext): string {
  const { visibleEnd = 4, maskChar = '*', preserveFormat = true } = opts;
  if (!ssn) return '';

  const digits = ssn.replace(/[\s-]/g, '');
  if (digits.length === 0) return ssn;

  const totalDigits = digits.length;
  const maskedLen = Math.max(0, totalDigits - visibleEnd);
  const unmaskedEnd = digits.slice(totalDigits - visibleEnd);

  if (!preserveFormat || !/[\s-]/.test(ssn)) {
    return maskChar.repeat(maskedLen) + unmaskedEnd;
  }

  // Preserve format e.g. 123-45-6789 -> ***-**-6789
  let digitIndex = 0;
  let result = '';
  for (let i = 0; i < ssn.length; i++) {
    const ch = ssn[i];
    if (ch === '-' || ch === ' ') {
      result += ch;
    } else {
      if (digitIndex < maskedLen) {
        result += maskChar;
      } else {
        result += ch;
      }
      digitIndex++;
    }
  }
  return result;
}

export const maskSsn = createDualModeMasker(runSsnMasking, { coerce: true });
