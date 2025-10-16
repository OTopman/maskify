import { MaskOptions } from '../utils';

export function maskAddress(value: string, opts: MaskOptions): string {
  const { maskChar = '*', maxAsterisks = 4 } = opts;
  return value
    .replace(/\d+/g, maskChar.repeat(3))
    .replace(/\b(\w{3,})\b/g, (m) => {
      const len = m.length;
      return (
        m[0] + maskChar.repeat(Math.min(maxAsterisks, len - 2)) + m[len - 1]
      );
    });
}
