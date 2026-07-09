import { createDualModeMasker, MaskContext } from '../core/masker';

export interface NameOptions {
  maskChar?: string;
  maxAsterisks?: number;
}

function runNameMasking(value: string, opts: NameOptions, _ctx: MaskContext): string {
  const { maskChar = '*', maxAsterisks = 4 } = opts;
  if (!value) return '';
  return value
    .split(/\s+/)
    .map((word) =>
      word.length > 2
        ? word[0] + maskChar.repeat(Math.min(maxAsterisks, word.length - 1))
        : maskChar.repeat(word.length)
    )
    .join(' ');
}

export const maskName = createDualModeMasker(runNameMasking);
