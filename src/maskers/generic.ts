import { createDualModeMasker, MaskContext } from '../core/masker';

export interface GenericOptions {
  visibleStart?: number;
  visibleEnd?: number;
  maxAsterisks?: number;
  maskChar?: string;
}

function runGenericMasking(value: string, opts: GenericOptions, _ctx: MaskContext): string {
  const { visibleStart = 0, visibleEnd = 0, maxAsterisks = 4, maskChar = '*' } = opts;

  if (!value || typeof value !== 'string') return '';

  const len = value.length;

  if (len <= visibleStart + visibleEnd) {
    const maskCount = Math.min(len - 1, maxAsterisks);
    return value[0] + maskChar.repeat(maskCount);
  }

  const start = value.slice(0, visibleStart);
  const end = visibleEnd > 0 ? value.slice(-visibleEnd) : '';
  const maskCount = Math.min(
    maxAsterisks,
    Math.max(len - visibleStart - visibleEnd, 3)
  );

  return `${start}${maskChar.repeat(maskCount)}${end}`;
}

export const maskGeneric = createDualModeMasker(runGenericMasking);
