import { MaskOptions } from '../utils';

export function maskName(value: string, opts: MaskOptions): string {
  const { maskChar = '*', maxAsterisks = 4 } = opts;
  return value
    .split(/\s+/)
    .map((word) =>
      word.length > 2
        ? word[0] + maskChar.repeat(Math.min(maxAsterisks, word.length - 1))
        : maskChar.repeat(word.length)
    )
    .join(' ');
}
