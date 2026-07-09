import { createDualModeMasker, MaskContext } from '../core/masker';

export interface AddressOptions {
  maskChar?: string;
  maxAsterisks?: number;
}

function runAddressMasking(value: string, opts: AddressOptions, _ctx: MaskContext): string {
  const { maskChar = '*', maxAsterisks = 4 } = opts;
  if (!value) return '';
  return value
    .replace(/\d+/g, maskChar.repeat(3))
    .replace(/\b(\w{3,})\b/g, (m) => {
      const len = m.length;
      return (
        m[0] + maskChar.repeat(Math.min(maxAsterisks, len - 2)) + m[len - 1]
      );
    });
}

export const maskAddress = createDualModeMasker(runAddressMasking);
