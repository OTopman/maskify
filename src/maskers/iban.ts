import { createDualModeMasker, MaskContext } from '../core/masker';

export interface IbanOptions {
  /** Number of unmasked characters at start (default: 4, preserving country code + check digits) */
  visibleStart?: number;
  /** Number of unmasked characters at end (default: 4, preserving account suffix) */
  visibleEnd?: number;
  /** Mask character (default: '*') */
  maskChar?: string;
  /** Preserve spacing/dash formatting of original input (default: true) */
  preserveFormat?: boolean;
}

/**
 * Validates an International Bank Account Number (IBAN) using the ISO 7064 Mod 97-10 algorithm.
 *
 * Checks:
 * 1. Country code (2 letters) + 2 check digits + 11-30 alphanumeric characters (15-34 total).
 * 2. Rearranged string (BBAN + Country Code + Check Digits).
 * 3. Modulo 97 on alphanumeric conversion string must equal 1.
 */
export function isValidIban(iban: string): boolean {
  if (!iban || typeof iban !== 'string') return false;
  const clean = iban.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) return false;

  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let remainder = 0;
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      // Letters A-Z -> 10-35
      const val = code - 55;
      remainder = (remainder * 100 + val) % 97;
    } else if (code >= 48 && code <= 57) {
      // Digits 0-9
      const val = code - 48;
      remainder = (remainder * 10 + val) % 97;
    } else {
      return false;
    }
  }
  return remainder === 1;
}

function runIbanMasking(iban: string, opts: IbanOptions, _ctx: MaskContext): string {
  const { visibleStart = 4, visibleEnd = 4, maskChar = '*', preserveFormat = true } = opts;
  if (!iban) return '';

  const clean = iban.replace(/[\s-]/g, '');
  if (clean.length === 0) return iban;

  const totalChars = clean.length;
  if (totalChars <= visibleStart + visibleEnd) {
    return maskChar.repeat(totalChars);
  }

  const unmaskedStart = clean.slice(0, visibleStart);
  const unmaskedEnd = clean.slice(totalChars - visibleEnd);
  const maskedMiddleLen = totalChars - visibleStart - visibleEnd;

  if (!preserveFormat || !/[\s-]/.test(iban)) {
    return unmaskedStart + maskChar.repeat(maskedMiddleLen) + unmaskedEnd;
  }

  let cleanIndex = 0;
  let result = '';
  for (let i = 0; i < iban.length; i++) {
    const ch = iban[i];
    if (ch === ' ' || ch === '-') {
      result += ch;
    } else {
      if (cleanIndex < visibleStart) {
        result += ch;
      } else if (cleanIndex >= totalChars - visibleEnd) {
        result += ch;
      } else {
        result += maskChar;
      }
      cleanIndex++;
    }
  }
  return result;
}

export const maskIban = createDualModeMasker(runIbanMasking);
